package secure_shop.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import secure_shop.backend.dto.invoice.InvoiceDetailDTO;
import secure_shop.backend.dto.invoice.InvoiceSummaryDTO;
import secure_shop.backend.dto.order.OrderDTO;
import secure_shop.backend.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.UUID;

public interface InvoiceService {

    /**
     * Tạo hóa đơn từ order đã hoàn tất (gọi ngay sau POS checkout).
     */
    InvoiceDetailDTO createFromOrder(
        OrderDTO order,
        UUID staffId,
        String staffName,
        BigDecimal cashReceived,
        PaymentMethod paymentMethod
    );

    InvoiceDetailDTO getById(UUID id);

    Page<InvoiceSummaryDTO> getAll(Pageable pageable);

    /**
     * Hủy hóa đơn (chỉ COMPLETED mới hủy được).
     * Sẽ rollback stock và ghi StockLog type=CANCEL.
     */
    InvoiceDetailDTO cancelInvoice(UUID id);

    /**
     * Export PDF — trả về byte array.
     */
    byte[] generatePdf(UUID id);
}
