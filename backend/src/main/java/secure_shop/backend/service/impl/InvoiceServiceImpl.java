package secure_shop.backend.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.dto.invoice.InvoiceDetailDTO;
import secure_shop.backend.dto.invoice.InvoiceItemDTO;
import secure_shop.backend.dto.invoice.InvoiceSummaryDTO;
import secure_shop.backend.dto.order.OrderDTO;
import secure_shop.backend.entities.*;
import secure_shop.backend.enums.InvoiceStatus;
import secure_shop.backend.enums.PaymentMethod;
import secure_shop.backend.enums.StockLogType;
import secure_shop.backend.exception.BusinessRuleViolationException;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.repositories.*;
import secure_shop.backend.service.InvoiceService;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository   invoiceRepository;
    private final StockLogRepository  stockLogRepository;
    private final OrderItemRepository orderItemRepository;
    private final InventoryRepository inventoryRepository;

    private static final DateTimeFormatter VN_DATE_FMT =
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    // ── Invoice Code Generator ─────────────────────────────────────────────────
    private synchronized String generateInvoiceCode() {
        int year = LocalDate.now().getYear();
        int seq  = invoiceRepository.findMaxSequenceForYear(year) + 1;
        return String.format("INV-%d-%05d", year, seq);
    }

    // ── Create Invoice from completed Order ────────────────────────────────────
    @Override
    @Transactional
    public InvoiceDetailDTO createFromOrder(
            OrderDTO order,
            UUID staffId,
            String staffName,
            BigDecimal cashReceived,
            PaymentMethod paymentMethod) {

        if (paymentMethod == PaymentMethod.COD && cashReceived != null) {
            if (cashReceived.compareTo(order.getGrandTotal()) < 0) {
                throw new BusinessRuleViolationException(
                    "Tien khach dua khong du. Can it nhat: " + order.getGrandTotal());
            }
        }

        BigDecimal effectiveCash = cashReceived != null ? cashReceived : order.getGrandTotal();
        BigDecimal changeAmount  = effectiveCash.subtract(order.getGrandTotal()).max(BigDecimal.ZERO);
        String     invoiceCode   = generateInvoiceCode();

        Invoice invoice = Invoice.builder()
            .invoiceCode(invoiceCode)
            .orderId(order.getId())
            .staffId(staffId)
            .staffName(staffName)
            .totalAmount(order.getGrandTotal())
            .cashReceived(effectiveCash)
            .changeAmount(changeAmount)
            .paymentMethod(paymentMethod != null ? paymentMethod : PaymentMethod.COD)
            .status(InvoiceStatus.COMPLETED)
            .build();

        var orderItems = orderItemRepository.findByOrderId(order.getId());
        for (var oi : orderItems) {
            InvoiceItem item = InvoiceItem.builder()
                .productId(oi.getProduct() != null ? oi.getProduct().getId() : null)
                .productName(oi.getProduct() != null ? oi.getProduct().getName() : "Unknown")
                .productSku(oi.getProduct() != null ? oi.getProduct().getSku() : null)
                .unitPrice(oi.getUnitPrice())
                .quantity(oi.getQuantity())
                .lineTotal(oi.getLineTotal())
                .build();
            invoice.addItem(item);

            if (oi.getProduct() != null) {
                Product p = oi.getProduct();
                int qtyAfter = inventoryRepository.findByProductId(p.getId())
                    .map(inv -> inv.getOnHand()).orElse(0);
                StockLog sl = StockLog.builder()
                    .productId(p.getId())
                    .productName(p.getName())
                    .changeQuantity(-oi.getQuantity())
                    .quantityAfter(qtyAfter)
                    .type(StockLogType.SALE)
                    .referenceId(invoiceCode)
                    .note("POS Sale - " + invoiceCode)
                    .build();
                stockLogRepository.save(sl);
            }
        }

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Created invoice {} for order {}", invoiceCode, order.getId());
        return toDetailDTO(saved);
    }

    // ── Get by ID ──────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public InvoiceDetailDTO getById(UUID id) {
        Invoice inv = invoiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        return toDetailDTO(inv);
    }

    // ── Get all ────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceSummaryDTO> getAll(Pageable pageable) {
        return invoiceRepository.findAllByOrderByCreatedAtDesc(pageable)
            .map(this::toSummaryDTO);
    }

    // ── Cancel invoice ─────────────────────────────────────────────────────────
    @Override
    @Transactional
    public InvoiceDetailDTO cancelInvoice(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessRuleViolationException("Hoa don da bi huy truoc do");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);

        for (InvoiceItem item : invoice.getItems()) {
            if (item.getProductId() != null) {
                inventoryRepository.findByProductId(item.getProductId()).ifPresent(inv -> {
                    inv.increaseStock(item.getQuantity());
                    inventoryRepository.save(inv);
                    StockLog sl = StockLog.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .changeQuantity(+item.getQuantity())
                        .quantityAfter(inv.getOnHand())
                        .type(StockLogType.CANCEL)
                        .referenceId(invoice.getInvoiceCode())
                        .note("Cancel invoice - " + invoice.getInvoiceCode())
                        .build();
                    stockLogRepository.save(sl);
                });
            }
        }

        invoiceRepository.save(invoice);
        log.info("Cancelled invoice {}", invoice.getInvoiceCode());
        return toDetailDTO(invoice);
    }

    // ── PDF Generation — Redesigned (A4, Professional) ─────────────────────────
    @Override
    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // ── Document: A4 portrait, 36pt margins ─────────────────────────
            Document doc = new Document(PageSize.A4, 36, 36, 48, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Color palette ────────────────────────────────────────────────
            Color PRIMARY  = new Color(79, 70, 229);    // indigo-600
            Color DARK     = new Color(17, 24, 39);     // gray-900
            Color MID      = new Color(107, 114, 128);  // gray-500
            Color LIGHT_BG = new Color(249, 250, 251);  // gray-50
            Color SUCCESS  = new Color(16, 185, 129);   // emerald-500
            Color DANGER   = new Color(239, 68, 68);    // red-500
            Color DIVIDER  = new Color(229, 231, 235);  // gray-200

            // ── Fonts ─────────────────────────────────────────────────────────
            Font fBrand  = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  22, PRIMARY);
            Font fSub    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   8, MID);
            Font fLabel  = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   8, MID);
            Font fValue  = FontFactory.getFont(FontFactory.HELVETICA,        9, DARK);
            Font fThHead = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   8, MID);
            Font fTdNorm = FontFactory.getFont(FontFactory.HELVETICA,        9, DARK);
            Font fTdBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   9, DARK);
            Font fTdSku  = FontFactory.getFont(FontFactory.HELVETICA,        7, MID);
            Font fTotalL = FontFactory.getFont(FontFactory.HELVETICA,        9, MID);
            Font fTotalV = FontFactory.getFont(FontFactory.HELVETICA,        9, DARK);
            Font fGrandL = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  13, DARK);
            Font fGrandV = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  16, PRIMARY);
            Font fChange = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  11, SUCCESS);
            Font fFooter = FontFactory.getFont(FontFactory.HELVETICA,        8, MID);
            boolean isComplete = invoice.getStatus() == InvoiceStatus.COMPLETED;
            Font fStatus = FontFactory.getFont(FontFactory.HELVETICA_BOLD,   8, isComplete ? SUCCESS : DANGER);

            // ════════════════════════════════════════════════════════════════
            // SECTION 1 — HEADER (brand left, invoice meta right)
            // ════════════════════════════════════════════════════════════════
            PdfPTable headerTbl = new PdfPTable(2);
            headerTbl.setWidthPercentage(100);
            headerTbl.setWidths(new float[]{1.4f, 1f});
            headerTbl.setSpacingAfter(16);

            // Brand cell (left)
            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.setPadding(0);
            Paragraph brandPara = new Paragraph("SecureShop", fBrand);
            brandPara.setSpacingAfter(3);
            brandCell.addElement(brandPara);
            brandCell.addElement(new Paragraph("HOA DON BAN HANG", fSub));
            headerTbl.addCell(brandCell);

            // Invoice info cell (right, right-aligned)
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setPadding(0);
            String statusTxt = isComplete ? "HOAN TAT" : "DA HUY";
            Paragraph codeP = new Paragraph(invoice.getInvoiceCode(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, DARK));
            codeP.setAlignment(Element.ALIGN_RIGHT);
            Paragraph dateP = new Paragraph(VN_DATE_FMT.format(invoice.getCreatedAt()), fValue);
            dateP.setAlignment(Element.ALIGN_RIGHT); dateP.setSpacingBefore(2);
            Paragraph statusP = new Paragraph("[" + statusTxt + "]", fStatus);
            statusP.setAlignment(Element.ALIGN_RIGHT); statusP.setSpacingBefore(4);
            rightCell.addElement(codeP);
            rightCell.addElement(dateP);
            rightCell.addElement(statusP);
            headerTbl.addCell(rightCell);
            doc.add(headerTbl);

            // ── Horizontal divider ────────────────────────────────────────────
            PdfPTable divLine = buildDivider(DIVIDER);
            doc.add(divLine);

            // ════════════════════════════════════════════════════════════════
            // SECTION 2 — META (4-column grid: label | value | label | value)
            // ════════════════════════════════════════════════════════════════
            PdfPTable metaTbl = new PdfPTable(4);
            metaTbl.setWidthPercentage(100);
            metaTbl.setWidths(new float[]{0.7f, 1.1f, 0.75f, 1.1f});
            metaTbl.setSpacingAfter(16);

            addMetaCell(metaTbl, "Ma hoa don",   fLabel);
            addMetaCell(metaTbl, invoice.getInvoiceCode(), fValue);
            addMetaCell(metaTbl, "Phuong thuc TT", fLabel);
            addMetaCell(metaTbl, formatPaymentMethod(invoice.getPaymentMethod()), fValue);

            addMetaCell(metaTbl, "Nhan vien", fLabel);
            addMetaCell(metaTbl, invoice.getStaffName() != null ? invoice.getStaffName() : "-", fValue);
            addMetaCell(metaTbl, "Trang thai", fLabel);
            addMetaCell(metaTbl, statusTxt, fStatus);

            doc.add(metaTbl);
            doc.add(divLine);

            // ════════════════════════════════════════════════════════════════
            // SECTION 3 — ITEMS TABLE (zebra rows, 50% product column)
            // ════════════════════════════════════════════════════════════════
            PdfPTable itemsTbl = new PdfPTable(new float[]{4f, 1f, 1.6f, 1.6f});
            itemsTbl.setWidthPercentage(100);
            itemsTbl.setSpacingAfter(20);
            itemsTbl.setHeaderRows(1);

            // Column headers
            String[] colHdrs  = {"San pham", "SL", "Don gia", "Thanh tien"};
            int[]    colAlign = {
                Element.ALIGN_LEFT, Element.ALIGN_CENTER,
                Element.ALIGN_RIGHT, Element.ALIGN_RIGHT
            };
            for (int i = 0; i < colHdrs.length; i++) {
                PdfPCell th = new PdfPCell(new Phrase(colHdrs[i], fThHead));
                th.setBackgroundColor(LIGHT_BG);
                th.setPaddingTop(8);  th.setPaddingBottom(8);
                th.setPaddingLeft(i == 0 ? 10 : 6);
                th.setPaddingRight(i == 3 ? 10 : 6);
                th.setHorizontalAlignment(colAlign[i]);
                th.setBorderWidthTop(1);    th.setBorderColorTop(DIVIDER);
                th.setBorderWidthBottom(1); th.setBorderColorBottom(DIVIDER);
                th.setBorderWidthLeft(0);   th.setBorderWidthRight(0);
                itemsTbl.addCell(th);
            }

            // Data rows with zebra striping
            List<InvoiceItem> items = invoice.getItems();
            for (int r = 0; r < items.size(); r++) {
                InvoiceItem item  = items.get(r);
                Color rowBg = (r % 2 == 0) ? Color.WHITE : LIGHT_BG;

                // Product name + SKU cell
                PdfPCell nameCell = new PdfPCell();
                nameCell.setBackgroundColor(rowBg);
                nameCell.setBorder(Rectangle.NO_BORDER);
                nameCell.setPaddingTop(7);  nameCell.setPaddingBottom(7);
                nameCell.setPaddingLeft(10); nameCell.setPaddingRight(6);
                Paragraph namePara = new Paragraph(item.getProductName(), fTdNorm);
                namePara.setSpacingAfter(1);
                nameCell.addElement(namePara);
                if (item.getProductSku() != null && !item.getProductSku().isBlank()) {
                    nameCell.addElement(new Paragraph("SKU: " + item.getProductSku(), fTdSku));
                }
                itemsTbl.addCell(nameCell);

                itemsTbl.addCell(makeStripedCell(
                    String.valueOf(item.getQuantity()), fTdNorm, Element.ALIGN_CENTER, rowBg));
                itemsTbl.addCell(makeStripedCell(
                    formatVnd(item.getUnitPrice()), fTdNorm, Element.ALIGN_RIGHT, rowBg));
                itemsTbl.addCell(makeStripedCell(
                    formatVnd(item.getLineTotal()), fTdBold, Element.ALIGN_RIGHT, rowBg));
            }
            doc.add(itemsTbl);

            // ════════════════════════════════════════════════════════════════
            // SECTION 4 — TOTALS (right-aligned summary box, thick divider)
            // ════════════════════════════════════════════════════════════════
            PdfPTable wrapTbl = new PdfPTable(new float[]{1f, 0.55f});
            wrapTbl.setWidthPercentage(100);
            wrapTbl.setSpacingAfter(24);

            PdfPCell spacer = new PdfPCell();
            spacer.setBorder(Rectangle.NO_BORDER);
            wrapTbl.addCell(spacer);

            PdfPCell totalBoxCell = new PdfPCell();
            totalBoxCell.setBorder(Rectangle.NO_BORDER);
            totalBoxCell.setPadding(0);

            PdfPTable innerTotals = new PdfPTable(2);
            innerTotals.setWidthPercentage(100);

            addTotalRow2(innerTotals, "Tong cong:", formatVnd(invoice.getTotalAmount()), fTotalL, fTotalV);
            addTotalRow2(innerTotals, "Phi van chuyen:", "Mien phi", fTotalL,
                FontFactory.getFont(FontFactory.HELVETICA, 9, SUCCESS));

            // Thick double-border above grand total
            for (int x = 0; x < 2; x++) {
                PdfPCell div2 = new PdfPCell();
                div2.setBorder(Rectangle.NO_BORDER);
                div2.setBorderWidthTop(2); div2.setBorderColorTop(DARK);
                div2.setMinimumHeight(6); div2.setPadding(0);
                innerTotals.addCell(div2);
            }

            addTotalRow2(innerTotals, "TONG TIEN:", formatVnd(invoice.getTotalAmount()), fGrandL, fGrandV);

            if (invoice.getCashReceived() != null) {
                // Small divider before cash section  
                for (int x = 0; x < 2; x++) {
                    PdfPCell div3 = new PdfPCell();
                    div3.setBorder(Rectangle.NO_BORDER);
                    div3.setBorderWidthTop(1); div3.setBorderColorTop(DIVIDER);
                    div3.setMinimumHeight(4); div3.setPadding(0);
                    innerTotals.addCell(div3);
                }
                addTotalRow2(innerTotals, "Khach dua:", formatVnd(invoice.getCashReceived()), fTotalL, fTotalV);
                addTotalRow2(innerTotals, "Tien thua:", formatVnd(invoice.getChangeAmount()), fTotalL, fChange);
            }

            totalBoxCell.addElement(innerTotals);
            wrapTbl.addCell(totalBoxCell);
            doc.add(wrapTbl);

            // ════════════════════════════════════════════════════════════════
            // SECTION 5 — FOOTER
            // ════════════════════════════════════════════════════════════════
            doc.add(buildDivider(DIVIDER));

            Paragraph ftr1 = new Paragraph("Cam on quy khach!", fFooter);
            ftr1.setAlignment(Element.ALIGN_CENTER); ftr1.setSpacingBefore(8);
            doc.add(ftr1);

            Paragraph ftr2 = new Paragraph("SecureShop -- Hotline: 1900-xxxx", fFooter);
            ftr2.setAlignment(Element.ALIGN_CENTER); ftr2.setSpacingBefore(2);
            doc.add(ftr2);

            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            log.error("PDF generation failed for invoice {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Khong the tao file PDF: " + e.getMessage(), e);
        }
    }

    // ── Mappers ────────────────────────────────────────────────────────────────
    private InvoiceDetailDTO toDetailDTO(Invoice inv) {
        List<InvoiceItemDTO> items = inv.getItems().stream().map(i -> InvoiceItemDTO.builder()
            .id(i.getId())
            .productId(i.getProductId())
            .productName(i.getProductName())
            .productSku(i.getProductSku())
            .unitPrice(i.getUnitPrice())
            .quantity(i.getQuantity())
            .lineTotal(i.getLineTotal())
            .build()).collect(Collectors.toList());

        return InvoiceDetailDTO.builder()
            .id(inv.getId())
            .invoiceCode(inv.getInvoiceCode())
            .orderId(inv.getOrderId())
            .staffId(inv.getStaffId())
            .staffName(inv.getStaffName())
            .totalAmount(inv.getTotalAmount())
            .cashReceived(inv.getCashReceived())
            .changeAmount(inv.getChangeAmount())
            .paymentMethod(inv.getPaymentMethod())
            .status(inv.getStatus())
            .note(inv.getNote())
            .createdAt(inv.getCreatedAt())
            .items(items)
            .build();
    }

    private InvoiceSummaryDTO toSummaryDTO(Invoice inv) {
        return InvoiceSummaryDTO.builder()
            .id(inv.getId())
            .invoiceCode(inv.getInvoiceCode())
            .staffId(inv.getStaffId())
            .staffName(inv.getStaffName())
            .totalAmount(inv.getTotalAmount())
            .paymentMethod(inv.getPaymentMethod())
            .status(inv.getStatus())
            .createdAt(inv.getCreatedAt())
            .itemCount(inv.getItems() != null ? inv.getItems().size() : 0)
            .build();
    }

    // ── PDF Helper Methods ─────────────────────────────────────────────────────

    /** Single horizontal divider line */
    private PdfPTable buildDivider(Color color) {
        PdfPTable div = new PdfPTable(1);
        div.setWidthPercentage(100);
        div.setSpacingBefore(4);
        div.setSpacingAfter(16);
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setBorderWidthBottom(1);
        cell.setBorderColorBottom(color);
        cell.setMinimumHeight(1);
        cell.setPadding(0);
        div.addCell(cell);
        return div;
    }

    /** Meta 4-column cell (no border, small padding) */
    private void addMetaCell(PdfPTable t, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingBottom(5);
        cell.setPaddingRight(8);
        t.addCell(cell);
    }

    /** Totals row: label left, value right */
    private void addTotalRow2(PdfPTable t, String label, String value, Font lFont, Font vFont) {
        PdfPCell lc = new PdfPCell(new Phrase(label, lFont));
        lc.setBorder(Rectangle.NO_BORDER);
        lc.setPaddingTop(4); lc.setPaddingBottom(4);
        lc.setHorizontalAlignment(Element.ALIGN_LEFT);
        PdfPCell vc = new PdfPCell(new Phrase(value, vFont));
        vc.setBorder(Rectangle.NO_BORDER);
        vc.setPaddingTop(4); vc.setPaddingBottom(4);
        vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(lc);
        t.addCell(vc);
    }

    /** Data cell with zebra background, no left/right border */
    private PdfPCell makeStripedCell(String text, Font font, int align, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(7);  cell.setPaddingBottom(7);
        cell.setPaddingLeft(6); cell.setPaddingRight(6);
        cell.setHorizontalAlignment(align);
        return cell;
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0 d";
        return String.format("%,.0f d", amount.doubleValue());
    }

    private String formatPaymentMethod(PaymentMethod m) {
        if (m == null) return "-";
        return switch (m) {
            case COD           -> "Tien mat";
            case E_WALLET      -> "VNPay / QR / Vi dien tu";
            case BANK_TRANSFER -> "Chuyen khoan";
            default            -> m.name();
        };
    }
}
