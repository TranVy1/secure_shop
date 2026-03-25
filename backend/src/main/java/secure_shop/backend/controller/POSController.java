package secure_shop.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.config.security.CustomUserDetails;
import secure_shop.backend.entities.User;
import secure_shop.backend.dto.invoice.InvoiceDetailDTO;
import secure_shop.backend.dto.order.OrderDTO;
import secure_shop.backend.dto.order.request.OrderCreateRequest;
import secure_shop.backend.enums.PaymentMethod;
import secure_shop.backend.enums.PaymentStatus;
import secure_shop.backend.exception.BusinessRuleViolationException;
import secure_shop.backend.service.InvoiceService;
import secure_shop.backend.service.OrderService;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
public class POSController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;

    // ── Inner DTOs ──────────────────────────────────────────────────────────

    @lombok.Data
    public static class POSCheckoutRequest {
        @jakarta.validation.Valid
        @jakarta.validation.constraints.NotEmpty(message = "Giỏ hàng không được trống")
        private java.util.List<secure_shop.backend.dto.order.request.OrderItemRequest> items;

        private PaymentMethod paymentMethod;

        /** Tiền khách đưa (bắt buộc khi paymentMethod=COD) */
        private BigDecimal cashReceived;
    }

    /** Response wrapper — COD returns invoice immediately, QR returns order only */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class POSCheckoutResponse {
        private OrderDTO order;
        private InvoiceDetailDTO invoice; // null when QR (pending payment)
        private boolean requiresPaymentConfirmation; // true for QR
    }

    // ═════════════════════════════════════════════════════════════════════════
    // POST /api/pos/checkout
    // ═════════════════════════════════════════════════════════════════════════

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<POSCheckoutResponse> checkoutPOS(
            @Valid @RequestBody POSCheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        PaymentMethod payMethod = request.getPaymentMethod() != null
            ? request.getPaymentMethod() : PaymentMethod.COD;

        // ── Build OrderCreateRequest ───────────────────────────────────────
        OrderCreateRequest orderReq = new OrderCreateRequest();
        orderReq.setItems(request.getItems());
        orderReq.setShippingFee(BigDecimal.ZERO);
        orderReq.setShippingAddress(Map.of(
            "fullName", safeStr(userDetails.getUser().getName(), "Khách Hàng"),
            "phone",    safeStr(userDetails.getUser().getPhone(), "0000000000"),
            "address",  "Mua tại cửa hàng (POS)",
            "type",     "In-Store"
        ));
        orderReq.setPaymentMethod(payMethod);

        // ── QR Flow: chỉ tạo order, chờ xác nhận thanh toán ──────────────
        if (payMethod == PaymentMethod.QR) {
            OrderDTO pendingOrder = orderService.createOrder(orderReq, userDetails.getUser().getId());
            return ResponseEntity.ok(POSCheckoutResponse.builder()
                .order(pendingOrder)
                .invoice(null)
                .requiresPaymentConfirmation(true)
                .build());
        }

        // ── COD Flow: atomic checkout (createOrder → confirmOrder → DELIVERED) ─
        OrderDTO completedOrder = orderService.createAndCompleteOrder(
            orderReq, userDetails.getUser().getId());

        // ── Validate cash ─────────────────────────────────────────────────
        if (payMethod == PaymentMethod.COD) {
            BigDecimal cash = request.getCashReceived();
            if (cash == null || cash.compareTo(completedOrder.getGrandTotal()) < 0) {
                throw new BusinessRuleViolationException(
                    "Tiền khách đưa không đủ. Tổng cần trả: " + completedOrder.getGrandTotal());
            }
        }

        // ── Create Invoice ────────────────────────────────────────────────
        User staff = userDetails.getUser();
        String staffName = (staff.getName() != null && !staff.getName().isBlank())
            ? staff.getName() : staff.getEmail();

        InvoiceDetailDTO invoice = invoiceService.createFromOrder(
            completedOrder,
            userDetails.getUser().getId(),
            staffName,
            request.getCashReceived(),
            payMethod
        );

        return ResponseEntity.ok(POSCheckoutResponse.builder()
            .order(completedOrder)
            .invoice(invoice)
            .requiresPaymentConfirmation(false)
            .build());
    }

    // ═════════════════════════════════════════════════════════════════════════
    // POST /api/pos/confirm-payment/{orderId}
    // Nhân viên xác nhận khách đã chuyển khoản QR thành công
    // ═════════════════════════════════════════════════════════════════════════

    @PostMapping("/confirm-payment/{orderId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<InvoiceDetailDTO> confirmQRPayment(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        // 1. Validate order exists and is still pending payment
        OrderDTO order = orderService.getOrderById(orderId);
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleViolationException("Đơn hàng này đã được thanh toán.");
        }

        // 2. Confirm → DELIVERED (consume stock, mark paid)
        orderService.confirmOrder(orderId);
        OrderDTO completedOrder = orderService.changeOrderStatus(orderId, "DELIVERED");

        // 3. Create Invoice
        User staff = userDetails.getUser();
        String staffName = (staff.getName() != null && !staff.getName().isBlank())
            ? staff.getName() : staff.getEmail();

        InvoiceDetailDTO invoice = invoiceService.createFromOrder(
            completedOrder,
            staff.getId(),
            staffName,
            completedOrder.getGrandTotal(), // QR: cash = exact total
            PaymentMethod.QR
        );

        return ResponseEntity.ok(invoice);
    }

    private String safeStr(String value, String fallback) {
        return (value != null && !value.isBlank()) ? value : fallback;
    }
}
