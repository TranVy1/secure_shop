package secure_shop.backend.service;

import secure_shop.backend.dto.barcode.BarcodeResponseDTO;
import secure_shop.backend.dto.barcode.CreateBarcodeRequest;

import java.util.List;
import java.util.UUID;

public interface BarcodeService {
    BarcodeResponseDTO createBarcode(CreateBarcodeRequest request);
    BarcodeResponseDTO getByBarcode(String barcode);
    List<BarcodeResponseDTO> getAllBarcodes();
    List<BarcodeResponseDTO> getByProductId(UUID productId);
    BarcodeResponseDTO autoGenerateForProduct(UUID productId, String sku);
    void deleteBarcode(Long id);
}
