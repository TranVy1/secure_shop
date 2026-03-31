package secure_shop.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.ProductColor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductColorRepository extends JpaRepository<ProductColor, UUID> {

    // Tìm tất cả colors của một sản phẩm
    List<ProductColor> findByProductIdAndActiveTrue(UUID productId);

    List<ProductColor> findByProductId(UUID productId);

    // Tìm color theo tên
    Optional<ProductColor> findByColorName(String colorName);

    // Tìm color theo hex code
    Optional<ProductColor> findByHexCode(String hexCode);

    // Tìm color theo product id và color name
    Optional<ProductColor> findByProductIdAndColorName(UUID productId, String colorName);

    // Đếm colors của sản phẩm
    long countByProductIdAndActiveTrueAndDeletedAtIsNull(UUID productId);

    // Kiểm tra hex code có tồn tại hay không
    boolean existsByHexCode(String hexCode);
}
