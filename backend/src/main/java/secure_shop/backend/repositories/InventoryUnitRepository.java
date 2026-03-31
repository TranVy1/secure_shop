package secure_shop.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.InventoryUnit;
import secure_shop.backend.entities.InventoryUnit.InventoryUnitStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryUnitRepository extends JpaRepository<InventoryUnit, UUID> {

    // Tìm unit theo IMEI/Serial
    Optional<InventoryUnit> findByImeiSerial(String imeiSerial);

    // Tìm tất cả units của một variant
    List<InventoryUnit> findByVariantId(UUID variantId);

    // Tìm tất cả units của một variant + color
    List<InventoryUnit> findByVariantIdAndColorId(UUID variantId, UUID colorId);

    // Tìm units theo trạng thái
    List<InventoryUnit> findByUnitStatus(InventoryUnitStatus status);

    // Tìm units AVAILABLE của một variant
    List<InventoryUnit> findByVariantIdAndUnitStatus(UUID variantId, InventoryUnitStatus status);

    // Đếm units theo trạng thái
    long countByUnitStatus(InventoryUnitStatus status);

    // Đếm units AVAILABLE của variant
    long countByVariantIdAndUnitStatus(UUID variantId, InventoryUnitStatus status);

    // Đếm tổng units của variant
    long countByVariantId(UUID variantId);

    // Query: Lấy units AVAILABLE theo variant + color
    @Query("""
            SELECT u FROM InventoryUnit u
            WHERE u.variant.id = :variantId
            AND u.color.id = :colorId
            AND u.unitStatus = 'AVAILABLE'
            AND u.deletedAt IS NULL
            """)
    List<InventoryUnit> findAvailableByVariantAndColor(
            @Param("variantId") UUID variantId,
            @Param("colorId") UUID colorId
    );

    // Query: Lấy units AVAILABLE của variant (bất kể color)
    @Query("""
            SELECT u FROM InventoryUnit u
            WHERE u.variant.id = :variantId
            AND u.unitStatus = 'AVAILABLE'
            AND u.deletedAt IS NULL
            ORDER BY u.createdAt ASC
            """)
    List<InventoryUnit> findAvailableByVariant(@Param("variantId") UUID variantId);

    // Query: Kiểm tra IMEI có tồn tại không (bao gồm deleted)
    @Query("""
            SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END
            FROM InventoryUnit u
            WHERE u.imeiSerial = :imei
            """)
    boolean existsByImei(@Param("imei") String imei);

    // Query: Lấy IMEIs available
    @Query("""
            SELECT u.imeiSerial FROM InventoryUnit u
            WHERE u.variant.id = :variantId
            AND u.unitStatus = 'AVAILABLE'
            AND u.deletedAt IS NULL
            """)
    List<String> findAvailableImeisByVariant(@Param("variantId") UUID variantId);
}
