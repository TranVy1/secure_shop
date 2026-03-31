package secure_shop.backend.mapper;

import org.springframework.stereotype.Component;
import secure_shop.backend.dto.product.ProductAttributeDTO;
import secure_shop.backend.entities.ProductAttribute;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductAttributeMapper {

    public ProductAttributeDTO toDTO(ProductAttribute entity) {
        if (entity == null) return null;

        return ProductAttributeDTO.builder()
                .id(entity.getId())
                .attributeKey(entity.getAttributeKey())
                .attributeName(entity.getAttributeName())
                .attributeValue(entity.getAttributeValue())
                .description(entity.getDescription())
                .valueType(entity.getValueType())
                .unit(entity.getUnit())
                .variantId(entity.getVariant() != null ? entity.getVariant().getId() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public ProductAttribute toEntity(ProductAttributeDTO dto) {
        if (dto == null) return null;

        ProductAttribute attr = ProductAttribute.builder()
                .attributeKey(dto.getAttributeKey())
                .attributeName(dto.getAttributeName())
                .attributeValue(dto.getAttributeValue())
                .description(dto.getDescription())
                .valueType(dto.getValueType())
                .unit(dto.getUnit())
                .build();
        
        if (dto.getId() != null) {
            attr.setId(dto.getId());
        }
        return attr;
    }

    public List<ProductAttributeDTO> toDTOList(List<ProductAttribute> entities) {
        if (entities == null) return Collections.emptyList();
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ProductAttribute> toEntityList(List<ProductAttributeDTO> dtos) {
        if (dtos == null) return Collections.emptyList();
        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}
