package secure_shop.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * ProductVariant - Biến thể sản phẩm
 * Ví dụ: Camera 2MP vs 4MP, Lens 2.8mm vs 4mm, Smart Lock Black vs White
 * Mỗi variant có SKU riêng, giá riêng, kho riêng
 */
@Entity
@Table(name = "product_variants", indexes = {
        @Index(name = "idx_variant_sku", columnList = "sku"),
        @Index(name = "idx_variant_product", columnList = "product_id"),
        @Index(name = "idx_variant_type", columnList = "variant_type"),
        @Index(name = "idx_variant_active", columnList = "active")
})
@SQLDelete(sql = "UPDATE product_variants SET deleted_at = GETDATE(), active = 0 WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant extends BaseEntity {

    @NotNull(message = "Sản phẩm không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotBlank(message = "Loại biến thể không được để trống")
    @Size(max = 100, message = "Loại biến thể tối đa 100 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Loại biến thể chỉ được chứa chữ, số, '-' và '_'")
    @Column(nullable = false, length = 100)
    private String variantType; // Ví dụ: "resolution", "lens_type", "color", "memory"

    @NotBlank(message = "Tên biến thể không được để trống")
    @Size(max = 255, message = "Tên biến thể tối đa 255 ký tự")
    @Column(nullable = false, length = 255)
    private String variantValue; // Ví dụ: "4MP", "2.8mm", "Black"

    @NotBlank(message = "Mã SKU không được để trống")
    @Size(max = 100, message = "Mã SKU tối đa 100 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9\\-_.]+$", message = "Mã SKU chỉ được chứa chữ, số và các ký tự '-', '_', '.'")
    @Column(nullable = false, unique = true, length = 100)
    private String sku; // Ví dụ: "CAM-4MP-SKU123"

    @NotNull(message = "Giá điều chỉnh không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá điều chỉnh không được âm")
    @Digits(integer = 10, fraction = 2, message = "Giá điều chỉnh không hợp lệ")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal priceAdjustment; // Ví dụ: +50.00 USD cho variant cao cấp

    @Size(max = 500, message = "Mô tả biến thể tối đa 500 ký tự")
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Size(max = 2048, message = "URL ảnh quá dài")
    private String imageUrl; // Ảnh riêng cho variant (optional)

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ===== Relations =====
    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VariantColorMapping> colorMappings = new ArrayList<>();

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<InventoryUnit> inventoryUnits = new HashSet<>();

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
}
