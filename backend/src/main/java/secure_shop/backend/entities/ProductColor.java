package secure_shop.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.*;

/**
 * ProductColor - Danh sách màu sắc khả dụng
 * Ví dụ: Black, White, Silver, Bronze
 */
@Entity
@Table(name = "product_colors", indexes = {
        @Index(name = "idx_color_product", columnList = "product_id"),
        @Index(name = "idx_color_name", columnList = "color_name"),
        @Index(name = "idx_color_active", columnList = "active")
})
@SQLDelete(sql = "UPDATE product_colors SET deleted_at = GETDATE(), active = 0 WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductColor extends BaseEntity {

    @NotNull(message = "Sản phẩm không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotBlank(message = "Tên màu không được để trống")
    @Size(max = 100, message = "Tên màu tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String colorName; // Ví dụ: "Black", "White", "Silver"

    @NotBlank(message = "Mã màu hex không được để trống")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Mã hex phải đúng định dạng (#RRGGBB)")
    @Column(nullable = false, length = 7, unique = true)
    private String hexCode; // Ví dụ: "#000000" cho Black

    @Size(max = 2048, message = "URL ảnh quá dài")
    private String imageUrl; // Ảnh mẫu màu

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ===== Relations =====
    @OneToMany(mappedBy = "color", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<VariantColorMapping> variantMappings = new HashSet<>();

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
