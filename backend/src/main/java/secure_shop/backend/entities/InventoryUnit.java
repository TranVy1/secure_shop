package secure_shop.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * InventoryUnit - Quản lý từng unit sản phẩm (IMEI/Serial tracking)
 * Ví dụ: Camera/Sensor cần theo dõi từng thiết bị riêng lẻ
 *
 * Trạng thái:
 * - AVAILABLE: sẵn có, chưa bán
 * - RESERVED: trong đơn hàng, đang chờ xác nhận
 * - SOLD: đã giao cho khách
 * - RETURNED: khách trả lại
 * - DAMAGED: hỏng
 */
@Entity
@Table(name = "inventory_units", indexes = {
        @Index(name = "idx_unit_imei", columnList = "imei_serial"),
        @Index(name = "idx_unit_variant", columnList = "variant_id"),
        @Index(name = "idx_unit_color", columnList = "color_id"),
        @Index(name = "idx_unit_status", columnList = "unit_status"),
        @Index(name = "idx_unit_order_item", columnList = "order_item_id")
})
@SQLDelete(sql = "UPDATE inventory_units SET deleted_at = GETDATE() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryUnit extends BaseEntity {

    @NotNull(message = "Biến thể không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    // Optional: màu của unit (nếu applies)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id")
    private ProductColor color;

    @NotBlank(message = "IMEI/Serial không được để trống")
    @Size(max = 100, message = "IMEI/Serial tối đa 100 ký tự")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "IMEI/Serial chỉ được chứa chữ và số")
    @Column(nullable = false, unique = true, length = 100)
    private String imeiSerial; // Ví dụ: "123456789000001", "CAM-2024-00001"

    @NotBlank(message = "Trạng thái không được để trống")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private InventoryUnitStatus unitStatus = InventoryUnitStatus.AVAILABLE;

    // Optional: quản lý warranty
    private Instant warrantyExpiresAt; // Hạn bảo hành

    // Optional: ghi chú (hỏng, khuyết tật, v.v.)
    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    // Optional: quản lý vị trí kho
    @Size(max = 100, message = "Vị trí tối đa 100 ký tự")
    @Column(length = 100)
    private String warehouseLocation; // Ví dụ: "Shelf A-12-3"

    // Optional: liên kết đến OrderItem khi được bán
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ===== Lifecycle Methods =====
    public enum InventoryUnitStatus {
        AVAILABLE,  // Sẵn có
        RESERVED,   // Đặt hàng, chưa giao
        SOLD,       // Đã giao
        RETURNED,   // Khách trả
        DAMAGED     // Hỏng
    }

    public boolean isAvailable() {
        return unitStatus == InventoryUnitStatus.AVAILABLE;
    }

    public void reserve() {
        this.unitStatus = InventoryUnitStatus.RESERVED;
    }

    public void sell() {
        this.unitStatus = InventoryUnitStatus.SOLD;
    }

    public void returnToInventory() {
        this.unitStatus = InventoryUnitStatus.RETURNED;
        this.orderItem = null;
    }

    public void markDamaged(String damageNotes) {
        this.unitStatus = InventoryUnitStatus.DAMAGED;
        this.notes = damageNotes;
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }

    public void delete() {
        this.deletedAt = Instant.now();
    }
}
