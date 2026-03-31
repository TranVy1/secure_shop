package secure_shop.backend.mapper;

import org.springframework.stereotype.Component;
import secure_shop.backend.dto.product.ProductColorDTO;
import secure_shop.backend.entities.ProductColor;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductColorMapper {

    public ProductColorDTO toDTO(ProductColor entity) {
        if (entity == null) return null;

        return ProductColorDTO.builder()
                .id(entity.getId())
                .colorName(entity.getColorName())
                .hexCode(entity.getHexCode())
                .imageUrl(entity.getImageUrl())
                .description(entity.getDescription())
                .active(entity.getActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public ProductColor toEntity(ProductColorDTO dto) {
        if (dto == null) return null;

        ProductColor color = ProductColor.builder()
                .colorName(dto.getColorName())
                .hexCode(dto.getHexCode())
                .imageUrl(dto.getImageUrl())
                .description(dto.getDescription())
                .active(dto.getActive())
                .build();
        
        if (dto.getId() != null) {
            color.setId(dto.getId());
        }
        return color;
    }

    public List<ProductColorDTO> toDTOList(List<ProductColor> entities) {
        if (entities == null) return Collections.emptyList();
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ProductColor> toEntityList(List<ProductColorDTO> dtos) {
        if (dtos == null) return Collections.emptyList();
        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}
