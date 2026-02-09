package secure_shop.backend.mapper;

import org.springframework.stereotype.Component;
import secure_shop.backend.dto.product.BrandDTO;
import secure_shop.backend.entities.Brand;

@Component
public class BrandMapper {

    public BrandDTO toDTO(Brand brand) {
        if (brand == null)
            return null;

        // Count only active products (not soft-deleted)
        int productCount = (int) brand.getProducts().stream()
                .filter(p -> p.getDeletedAt() == null)
                .count();

        return BrandDTO.builder()
                .id(brand.getId())
                .name(brand.getName())
                .productCount(productCount)
                .build();
    }

    public Brand toEntity(BrandDTO dto) {
        if (dto == null)
            return null;
        return Brand.builder()
                .id(dto.getId())
                .name(dto.getName())
                .build();
    }
}