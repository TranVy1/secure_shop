package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.dto.barcode.BarcodeResponseDTO;
import secure_shop.backend.dto.barcode.CreateBarcodeRequest;
import secure_shop.backend.entities.Barcode;
import secure_shop.backend.entities.Product;
import secure_shop.backend.exception.ResourceAlreadyExistsException;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.repositories.BarcodeRepository;
import secure_shop.backend.repositories.ProductRepository;
import secure_shop.backend.service.BarcodeService;
import secure_shop.backend.mapper.ProductMapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BarcodeServiceImpl implements BarcodeService {

    private final BarcodeRepository barcodeRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public BarcodeResponseDTO createBarcode(CreateBarcodeRequest request) {
        if (barcodeRepository.existsByBarcode(request.getBarcode())) {
            throw new ResourceAlreadyExistsException("Mã vạch đã tồn tại: " + request.getBarcode());
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("sản phẩm", request.getProductId()));

        Barcode barcode = Barcode.builder()
                .barcode(request.getBarcode())
                .product(product)
                .serialNumber(request.getSerialNumber())
                .build();

        Barcode saved = barcodeRepository.save(barcode);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BarcodeResponseDTO getByBarcode(String barcode) {
        Barcode entity = barcodeRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("mã vạch", barcode));
        return mapToDTO(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BarcodeResponseDTO> getAllBarcodes() {
        return barcodeRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BarcodeResponseDTO> getByProductId(UUID productId) {
        return barcodeRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BarcodeResponseDTO autoGenerateForProduct(UUID productId, String sku) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("sản phẩm", productId));

        // Generate a unique numeric barcode (EAN-13 style: 13 digits)
        String generated;
        int attempts = 0;
        do {
            generated = generateEan13(sku);
            attempts++;
            if (attempts > 10) {
                throw new IllegalStateException("Không thể tạo mã vạch duy nhất sau nhiều lần thử");
            }
        } while (barcodeRepository.existsByBarcode(generated));

        Barcode barcode = Barcode.builder()
                .barcode(generated)
                .product(product)
                .build();

        return mapToDTO(barcodeRepository.save(barcode));
    }

    @Override
    @Transactional
    public void deleteBarcode(Long id) {
        if (!barcodeRepository.existsById(id)) {
            throw new ResourceNotFoundException("mã vạch", id);
        }
        barcodeRepository.deleteById(id);
    }

    private String generateEan13(String sku) {
        // Use hash of SKU + timestamp to produce a stable but unique 12-digit base
        long timestamp = System.currentTimeMillis();
        int skuHash = Math.abs(sku != null ? sku.hashCode() : 0);
        String base12 = String.format("%06d%06d", skuHash % 1_000_000, (timestamp / 1000) % 1_000_000);
        // Calculate EAN-13 check digit
        int checkDigit = calculateEan13CheckDigit(base12);
        return base12 + checkDigit;
    }

    private int calculateEan13CheckDigit(String base12) {
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = Character.getNumericValue(base12.charAt(i));
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        return (10 - (sum % 10)) % 10;
    }

    private BarcodeResponseDTO mapToDTO(Barcode barcode) {
        return BarcodeResponseDTO.builder()
                .id(barcode.getId())
                .barcode(barcode.getBarcode())
                .serialNumber(barcode.getSerialNumber())
                .createdAt(barcode.getCreatedAt())
                .product(productMapper.toProductSummaryDTO(barcode.getProduct()))
                .build();
    }
}
