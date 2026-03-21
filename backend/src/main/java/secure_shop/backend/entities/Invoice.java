package secure_shop.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import secure_shop.backend.enums.InvoiceStatus;
import secure_shop.backend.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * POS Invoice — tạo tự động mỗi khi checkout tại quầy.
 * Độc lập với Order entity hiện tại, link qua order_id.
 */
@Entity
@Table(name = "invoices", indexes = {
    @Index(name = "idx_invoices_code",     columnList = "invoice_code", unique = true),
    @Index(name = "idx_invoices_staff",    columnList = "staff_id"),
    @Index(name = "idx_invoices_order",    columnList = "order_id"),
    @Index(name = "idx_invoices_status",   columnList = "status"),
    @Index(name = "idx_invoices_created",  columnList = "created_at")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** INV-2026-00001 — unique per year */
    @Column(name = "invoice_code", nullable = false, length = 30, unique = true)
    private String invoiceCode;

    /** FK → orders.id */
    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    /** FK → users.id — staff who processed */
    @Column(name = "staff_id", nullable = false)
    private UUID staffId;

    @Column(name = "staff_name", length = 200)
    private String staffName;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    /** Tiền khách đưa */
    @Column(name = "cash_received", precision = 18, scale = 2)
    private BigDecimal cashReceived;

    /** Tiền thừa = cashReceived - totalAmount */
    @Column(name = "change_amount", precision = 18, scale = 2)
    private BigDecimal changeAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.COMPLETED;

    @Column(name = "note", length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "datetimeoffset(6)")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "datetimeoffset(6)")
    private Instant updatedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    // Helper
    public void addItem(InvoiceItem item) {
        item.setInvoice(this);
        this.items.add(item);
    }
}
