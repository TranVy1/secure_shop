package secure_shop.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * VariantColorMapping - Mapping giữa Variant × Color
 * Tạo SKU unique cho mỗi combination variant + color
 * Ví dụ: Camera 4MP Black, Camera 4MP White, Camera 2MP Black, etc.
 */
@Entity
@Table(name = "variant_color_mappings", indexes = {
        @Index(name = "idx_mapping_variant_color", columnList = "variant_id,color_id", unique = true),
        @Index(name = "idx_mapping_sku", columnList = "sku"),
        @Index(name = "idx_mapping_active", columnList = "active")
})
@SQLDelete(sql = "UPDATE variant_color_mappings SET deleted_at = GETDATE(), active = 0 WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariantColorMapping extends BaseEntity {

    @NotNull(message = "Biến thể không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @NotNull(message = "Màu không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id", nullable = false)
    private ProductColor color;

    @NotBlank(message = "Mã SKU không được để trống")
    @Size(max = 100, message = "Mã SKU tối đa 100 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9\\-_.]+$", message = "Mã SKU chỉ được chứa chữ, số và các ký tự '-', '_', '.'")
    @Column(nullable = false, unique = true, length = 100)
    private String sku; // Ví dụ: "CAM-4MP-BLACK-SKU001"

    // Optional: giá điều chỉnh riêng cho combination này (sau khi cộng giá variant)
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá điều chỉnh không được âm")
    @Digits(integer = 10, fraction = 2, message = "Giá điều chỉnh không hợp lệ")
    @Column(precision = 15, scale = 2)
    private BigDecimal colorPriceAdjustment; // Ví dụ: +10 cho màu đặc biệt

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description; // Ví dụ: "Camera 4MP, màu đen, bao gồm PoE cable"

    @Size(max = 2048, message = "URL ảnh quá dài")
    private String imageUrl; // Ảnh sản phẩm theo combination variant-color

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ===== Helper Methods =====
    public void softDelete() {
        this.deletedAt = Instant.now();
        this.active = false;
    }

    public void restore() {
        this.deletedAt = null;
        this.active = true;
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }

    public BigDecimal getTotalPriceAdjustment() {
        BigDecimal variantAdj = variant.getPriceAdjustment() != null ? variant.getPriceAdjustment() : BigDecimal.ZERO;
        BigDecimal colorAdj = colorPriceAdjustment != null ? colorPriceAdjustment : BigDecimal.ZERO;
        return variantAdj.add(colorAdj);
    }
}
