package secure_shop.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Snapshot of each product line in a POS invoice.
 * Tên & giá được lưu tại thời điểm bán để đảm bảo audit integrity.
 */
@Entity
@Table(name = "invoice_items", indexes = {
    @Index(name = "idx_inv_items_invoice", columnList = "invoice_id"),
    @Index(name = "idx_inv_items_product", columnList = "product_id")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    /** product_id snapshot — FK cho reporting, nullable nếu SP bị xóa */
    @Column(name = "product_id")
    private UUID productId;

    /** Tên sản phẩm tại thời điểm bán — immutable */
    @Column(name = "product_name", nullable = false, length = 300)
    private String productName;

    @Column(name = "product_sku", length = 100)
    private String productSku;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "line_total", nullable = false, precision = 18, scale = 2)
    private BigDecimal lineTotal;
}
