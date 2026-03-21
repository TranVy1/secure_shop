package secure_shop.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.dto.invoice.InvoiceDetailDTO;
import secure_shop.backend.dto.invoice.InvoiceSummaryDTO;
import secure_shop.backend.service.InvoiceService;

import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    /**
     * GET /api/invoices?page=0&size=20
     * Danh sách hóa đơn, mới nhất trước.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Page<InvoiceSummaryDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(invoiceService.getAll(pageable));
    }

    /**
     * GET /api/invoices/{id}
     * Chi tiết hóa đơn kèm danh sách sản phẩm.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<InvoiceDetailDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.getById(id));
    }

    /**
     * GET /api/invoices/{id}/pdf
     * Export PDF — Content-Type: application/pdf.
     */
    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<byte[]> getPdf(@PathVariable UUID id) {
        byte[] pdf = invoiceService.generatePdf(id);
        InvoiceDetailDTO inv = invoiceService.getById(id);

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + inv.getInvoiceCode() + ".pdf\"")
            .body(pdf);
    }

    /**
     * POST /api/invoices/{id}/cancel
     * Hủy hóa đơn, rollback tồn kho, ghi StockLog CANCEL.
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<InvoiceDetailDTO> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id));
    }
}
