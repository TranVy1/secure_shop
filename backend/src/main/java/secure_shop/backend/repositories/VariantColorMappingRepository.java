package secure_shop.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.VariantColorMapping;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VariantColorMappingRepository extends JpaRepository<VariantColorMapping, UUID> {

    // Tìm mapping theo variant + color (unique pair)
    Optional<VariantColorMapping> findByVariantIdAndColorId(UUID variantId, UUID colorId);

    // Tìm tất cả mappings của một variant
    List<VariantColorMapping> findByVariantId(UUID variantId);

    // Tìm tất cả mappings của một color
    List<VariantColorMapping> findByColorId(UUID colorId);

    // Tìm mapping theo SKU
    Optional<VariantColorMapping> findBySku(String sku);

    // Tìm active mappings của một variant
    List<VariantColorMapping> findByVariantIdAndActiveTrue(UUID variantId);

    // Tìm active mappings của một color
    List<VariantColorMapping> findByColorIdAndActiveTrue(UUID colorId);

    // Đếm mappings của variant
    long countByVariantId(UUID variantId);

    // Đếm mappings của color
    long countByColorId(UUID colorId);

    // Kiểm tra SKU có tồn tại không
    boolean existsBySku(String sku);

    // Kiểm tra mapping có tồn tại (variant + color)
    boolean existsByVariantIdAndColorId(UUID variantId, UUID colorId);
}
