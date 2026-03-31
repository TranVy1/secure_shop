package secure_shop.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * ProductAttribute - Đặc tính/thông số sản phẩm động
 * Ví dụ:
 * - Camera: Resolution=4MP, Lens Type=Varifocal, IR Range=50m
 * - Sensor: Type=Motion, Range=10m, Sensitivity=High
 * - Smart Lock: Power Type=Battery, Connection=WiFi, Security Rating=Grade A
 */
@Entity
@Table(name = "product_attributes", indexes = {
        @Index(name = "idx_attr_product", columnList = "product_id"),
        @Index(name = "idx_attr_key", columnList = "attribute_key"),
        @Index(name = "idx_attr_variant", columnList = "variant_id")
})
@SQLDelete(sql = "UPDATE product_attributes SET deleted_at = GETDATE() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductAttribute extends BaseEntity {

    @NotNull(message = "Sản phẩm không được để trống")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Optional: nếu attribute này dành cho variant cụ thể
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @NotBlank(message = "Khóa đặc tính không được để trống")
    @Size(max = 100, message = "Khóa tối đa 100 ký tự")
    @Pattern(regexp = "^[a-z_]+$", message = "Khóa chỉ được chứa chữ thường và '_'")
    @Column(nullable = false, length = 100)
    private String attributeKey; // Ví dụ: "resolution", "lens_type", "ir_range"

    @NotBlank(message = "Tên đặc tính không được để trống")
    @Size(max = 100, message = "Tên tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String attributeName; // Ví dụ: "Độ phân giải", "Loại lens", "Tầm hồng ngoại"

    @NotBlank(message = "Giá trị đặc tính không được để trống")
    @Size(max = 500, message = "Giá trị tối đa 500 ký tự")
    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String attributeValue; // Ví dụ: "4MP", "Varifocal", "50m"

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description; // Ví dụ: "Độ phân giải video"

    // Optional: định dạng giá trị (string, number, boolean, select)
    @Builder.Default
    @Column(length = 50)
    private String valueType = "string"; // string, number, boolean, select

    // Optional: unit của giá trị
    @Column(length = 50)
    private String unit; // Ví dụ: "m" cho khoảng cách, "MP" cho độ phân giải

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ===== Helper Methods =====
    public boolean isDeleted() {
        return this.deletedAt != null;
    }

    public void delete() {
        this.deletedAt = Instant.now();
    }

    public void restore() {
        this.deletedAt = null;
    }
}
