package secure_shop.backend.dto.invoice;

import lombok.Builder;
import lombok.Data;
import secure_shop.backend.enums.InvoiceStatus;
import secure_shop.backend.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class InvoiceSummaryDTO {
    private UUID id;
    private String invoiceCode;
    private UUID staffId;
    private String staffName;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private InvoiceStatus status;
    private Instant createdAt;
    private int itemCount;
}
