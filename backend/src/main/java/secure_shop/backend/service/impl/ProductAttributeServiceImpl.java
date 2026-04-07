package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.dto.product.ProductAttributeDTO;
import secure_shop.backend.entities.Product;
import secure_shop.backend.entities.ProductAttribute;
import secure_shop.backend.entities.ProductVariant;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.mapper.ProductAttributeMapper;
import secure_shop.backend.repositories.ProductAttributeRepository;
import secure_shop.backend.repositories.ProductRepository;
import secure_shop.backend.repositories.ProductVariantRepository;
import secure_shop.backend.service.ProductAttributeService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductAttributeServiceImpl implements ProductAttributeService {

    private final ProductAttributeRepository attributeRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductAttributeMapper attributeMapper;

    @Override
    @Transactional
    public ProductAttributeDTO createAttribute(UUID productId, ProductAttributeDTO dto) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        ProductAttribute attribute = attributeMapper.toEntity(dto);
        attribute.setProduct(product);
        
        if (dto.getVariantId() != null) {
            ProductVariant variant = variantRepository.findById(dto.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant", dto.getVariantId()));
            attribute.setVariant(variant);
        }
        
        ProductAttribute saved = attributeRepository.save(attribute);
        return attributeMapper.toDTO(saved);
    }

    @Override
    public ProductAttributeDTO getAttributeById(UUID attributeId) {
        ProductAttribute attribute = attributeRepository.findById(attributeId)
                .orElseThrow(() -> new ResourceNotFoundException("Attribute", attributeId));
        return attributeMapper.toDTO(attribute);
    }

    @Override
    public List<ProductAttributeDTO> getAttributesByProduct(UUID productId) {
        List<ProductAttribute> attributes = attributeRepository.findByProductId(productId);
        return attributeMapper.toDTOList(attributes);
    }

    @Override
    public List<ProductAttributeDTO> getAttributesByVariant(UUID variantId) {
        List<ProductAttribute> attributes = attributeRepository.findByVariantId(variantId);
        return attributeMapper.toDTOList(attributes);
    }

    @Override
    @Transactional
    public ProductAttributeDTO updateAttribute(UUID attributeId, ProductAttributeDTO dto) {
        ProductAttribute attribute = attributeRepository.findById(attributeId)
                .orElseThrow(() -> new ResourceNotFoundException("Attribute", attributeId));

        attribute.setAttributeKey(dto.getAttributeKey());
        attribute.setAttributeName(dto.getAttributeName());
        attribute.setAttributeValue(dto.getAttributeValue());
        attribute.setDescription(dto.getDescription());
        attribute.setValueType(dto.getValueType());
        attribute.setUnit(dto.getUnit());

        if (dto.getVariantId() != null) {
             ProductVariant variant = variantRepository.findById(dto.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant", dto.getVariantId()));
             attribute.setVariant(variant);
        } else {
             attribute.setVariant(null);
        }

        ProductAttribute updated = attributeRepository.save(attribute);
        return attributeMapper.toDTO(updated);
    }

    @Override
    @Transactional
    public void deleteAttribute(UUID attributeId) {
        ProductAttribute attribute = attributeRepository.findById(attributeId)
                .orElseThrow(() -> new ResourceNotFoundException("Attribute", attributeId));
        
        // Since product_attributes uses @SQLDelete in the entity, this triggers soft delete
        attributeRepository.delete(attribute);
    }
}
