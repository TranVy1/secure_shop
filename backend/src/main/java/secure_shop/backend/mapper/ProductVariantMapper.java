package secure_shop.backend.mapper;

import org.springframework.stereotype.Component;
import secure_shop.backend.dto.product.ProductVariantDTO;
import secure_shop.backend.entities.ProductVariant;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductVariantMapper {

    public ProductVariantDTO toDTO(ProductVariant entity) {
        if (entity == null) return null;

        return ProductVariantDTO.builder()
                .id(entity.getId())
                .variantType(entity.getVariantType())
                .variantValue(entity.getVariantValue())
                .sku(entity.getSku())
                .priceAdjustment(entity.getPriceAdjustment())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .active(entity.getActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public ProductVariant toEntity(ProductVariantDTO dto) {
        if (dto == null) return null;

        ProductVariant variant = ProductVariant.builder()
                .variantType(dto.getVariantType())
                .variantValue(dto.getVariantValue())
                .sku(dto.getSku())
                .priceAdjustment(dto.getPriceAdjustment())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .active(dto.getActive())
                .build();
        
        if (dto.getId() != null) {
            variant.setId(dto.getId());
        }
        return variant;
    }

    public List<ProductVariantDTO> toDTOList(List<ProductVariant> entities) {
        if (entities == null) return Collections.emptyList();
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ProductVariant> toEntityList(List<ProductVariantDTO> dtos) {
        if (dtos == null) return Collections.emptyList();
        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}
