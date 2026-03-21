package secure_shop.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import secure_shop.backend.enums.StockLogType;

import java.time.Instant;
import java.util.UUID;

/**
 * Audit trail mọi biến động tồn kho.
 * Được tạo tự động khi POS sale, cancel invoice, hoặc nhập kho.
 */
@Entity
@Table(name = "stock_logs", indexes = {
    @Index(name = "idx_stock_logs_product",   columnList = "product_id"),
    @Index(name = "idx_stock_logs_type",      columnList = "type"),
    @Index(name = "idx_stock_logs_created",   columnList = "created_at"),
    @Index(name = "idx_stock_logs_reference", columnList = "reference_id")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StockLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", length = 300)
    private String productName;

    /** Dương → nhập; Âm → xuất */
    @Column(name = "change_quantity", nullable = false)
    private Integer changeQuantity;

    /** Tồn kho sau khi thay đổi */
    @Column(name = "quantity_after")
    private Integer quantityAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private StockLogType type;

    /** invoice_code hoặc order_id string */
    @Column(name = "reference_id", length = 60)
    private String referenceId;

    @Column(name = "note", length = 300)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "datetimeoffset(6)")
    private Instant createdAt;
}
