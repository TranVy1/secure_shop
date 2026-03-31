package secure_shop.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.ProductAttribute;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, UUID> {

    // Tìm tất cả attributes của một sản phẩm
    List<ProductAttribute> findByProductId(UUID productId);

    // Tìm attributes của một product variant
    List<ProductAttribute> findByVariantId(UUID variantId);

    // Tìm attribute theo product id và attribute key
    Optional<ProductAttribute> findByProductIdAndAttributeKey(UUID productId, String attributeKey);

    // Tìm attribute theo product id, variant id và attribute key
    Optional<ProductAttribute> findByProductIdAndVariantIdAndAttributeKey(
            UUID productId, UUID variantId, String attributeKey
    );

    // Tìm attributes theo attribute key (cross-product)
    List<ProductAttribute> findByAttributeKey(String attributeKey);

    // Tìm attributes theo attribute type (value_type)
    List<ProductAttribute> findByValueType(String valueType);

    // Đếm attributes của sản phẩm
    long countByProductId(UUID productId);

    // Đếm attributes của variant
    long countByVariantId(UUID variantId);
}
