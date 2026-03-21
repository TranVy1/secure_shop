package secure_shop.backend.dto.invoice;

import lombok.Builder;
import lombok.Data;
import secure_shop.backend.enums.InvoiceStatus;
import secure_shop.backend.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class InvoiceDetailDTO {
    private UUID id;
    private String invoiceCode;
    private UUID orderId;
    private UUID staffId;
    private String staffName;
    private BigDecimal totalAmount;
    private BigDecimal cashReceived;
    private BigDecimal changeAmount;
    private PaymentMethod paymentMethod;
    private InvoiceStatus status;
    private String note;
    private Instant createdAt;
    private List<InvoiceItemDTO> items;
}
