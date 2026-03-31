package secure_shop.backend.mapper;

import org.springframework.stereotype.Component;
import secure_shop.backend.dto.product.VariantColorMappingDTO;
import secure_shop.backend.entities.VariantColorMapping;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class VariantColorMappingMapper {

    private final ProductVariantMapper variantMapper;
    private final ProductColorMapper colorMapper;

    public VariantColorMappingMapper(ProductVariantMapper variantMapper, ProductColorMapper colorMapper) {
        this.variantMapper = variantMapper;
        this.colorMapper = colorMapper;
    }

    public VariantColorMappingDTO toDTO(VariantColorMapping entity) {
        if (entity == null) return null;

        return VariantColorMappingDTO.builder()
                .id(entity.getId())
                .sku(entity.getSku())
                .colorPriceAdjustment(entity.getColorPriceAdjustment())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .active(entity.getActive())
                .variantId(entity.getVariant() != null ? entity.getVariant().getId() : null)
                .variant(entity.getVariant() != null ? variantMapper.toDTO(entity.getVariant()) : null)
                .colorId(entity.getColor() != null ? entity.getColor().getId() : null)
                .color(entity.getColor() != null ? colorMapper.toDTO(entity.getColor()) : null)
                .totalPriceAdjustment(entity.getTotalPriceAdjustment())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public VariantColorMapping toEntity(VariantColorMappingDTO dto) {
        if (dto == null) return null;

        VariantColorMapping mapping = VariantColorMapping.builder()
                .sku(dto.getSku())
                .colorPriceAdjustment(dto.getColorPriceAdjustment())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .active(dto.getActive())
                .build();
        
        if (dto.getId() != null) {
            mapping.setId(dto.getId());
        }
        return mapping;
    }

    public List<VariantColorMappingDTO> toDTOList(List<VariantColorMapping> entities) {
        if (entities == null) return Collections.emptyList();
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<VariantColorMapping> toEntityList(List<VariantColorMappingDTO> dtos) {
        if (dtos == null) return Collections.emptyList();
        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}
