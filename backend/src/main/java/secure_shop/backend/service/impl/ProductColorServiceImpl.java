package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.dto.product.ProductColorDTO;
import secure_shop.backend.entities.Product;
import secure_shop.backend.entities.ProductColor;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.mapper.ProductColorMapper;
import secure_shop.backend.repositories.ProductColorRepository;
import secure_shop.backend.repositories.ProductRepository;
import secure_shop.backend.service.ProductColorService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductColorServiceImpl implements ProductColorService {

    private final ProductColorRepository colorRepository;
    private final ProductRepository productRepository;
    private final ProductColorMapper colorMapper;

    @Override
    @Transactional
    public ProductColorDTO createColor(UUID productId, ProductColorDTO dto) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        // Kiểm tra xem sản phẩm đã có mầu này chưa (trùng tên hoặc mã hex)
        List<ProductColor> existingColors = colorRepository.findByProductId(productId);
        for (ProductColor c : existingColors) {
            if (c.getColorName().equalsIgnoreCase(dto.getColorName())) {
                throw new secure_shop.backend.exception.ResourceAlreadyExistsException(
                        "Sản phẩm này đã có màu tên '" + dto.getColorName() + "'.");
            }
            if (c.getHexCode().equalsIgnoreCase(dto.getHexCode())) {
                throw new secure_shop.backend.exception.ResourceAlreadyExistsException(
                        "Sản phẩm này đã có màu với mã hex '" + dto.getHexCode() + "'.");
            }
        }

        ProductColor color = colorMapper.toEntity(dto);
        color.setProduct(product);
        
        ProductColor saved = colorRepository.save(color);
        return colorMapper.toDTO(saved);
    }

    @Override
    public ProductColorDTO getColorById(UUID colorId) {
        ProductColor color = colorRepository.findById(colorId)
                .orElseThrow(() -> new ResourceNotFoundException("Color", colorId));
        return colorMapper.toDTO(color);
    }

    @Override
    public List<ProductColorDTO> getColorsByProduct(UUID productId) {
        List<ProductColor> colors = colorRepository.findByProductIdAndActiveTrue(productId);
        return colorMapper.toDTOList(colors);
    }

    @Override
    @Transactional
    public ProductColorDTO updateColor(UUID colorId, ProductColorDTO dto) {
        ProductColor color = colorRepository.findById(colorId)
                .orElseThrow(() -> new ResourceNotFoundException("Color", colorId));

        color.setColorName(dto.getColorName());
        color.setHexCode(dto.getHexCode());
        color.setImageUrl(dto.getImageUrl());
        color.setDescription(dto.getDescription());
        color.setActive(dto.getActive());

        ProductColor updated = colorRepository.save(color);
        return colorMapper.toDTO(updated);
    }

    @Override
    @Transactional
    public void deleteColor(UUID colorId) {
        ProductColor color = colorRepository.findById(colorId)
                .orElseThrow(() -> new ResourceNotFoundException("Color", colorId));
        color.softDelete();
        colorRepository.save(color);
    }
}
