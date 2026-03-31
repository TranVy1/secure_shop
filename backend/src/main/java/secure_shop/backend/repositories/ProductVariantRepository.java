package secure_shop.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.ProductVariant;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    // Tìm tất cả variants của một sản phẩm
    List<ProductVariant> findByProductIdAndActiveTrue(UUID productId);

    List<ProductVariant> findByProductId(UUID productId);

    // Tìm variant theo SKU
    Optional<ProductVariant> findBySku(String sku);

    // Tìm variants theo loại (type)
    List<ProductVariant> findByProductIdAndVariantType(UUID productId, String variantType);

    // Tìm variant theo product id và variant type + value combo
    Optional<ProductVariant> findByProductIdAndVariantTypeAndVariantValue(
            UUID productId, String variantType, String variantValue
    );

    // Đếm variants của sản phẩm
    long countByProductIdAndActiveTrueAndDeletedAtIsNull(UUID productId);

    // Tìm tất cả variants (bao gồm deleted)
    @Query("SELECT pv FROM ProductVariant pv WHERE pv.product.id = :productId")
    List<ProductVariant> findAllByProductId(@Param("productId") UUID productId);
}
