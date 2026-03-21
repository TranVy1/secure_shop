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
import secure_shop.backend.exception.BusinessRuleViolationException;
import secure_shop.backend.service.InvoiceService;
import secure_shop.backend.service.OrderService;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
public class POSController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;

    /**
     * POS Checkout — tạo đơn hàng atomic + invoice trong cùng request.
     *
     * Request body bổ sung:
     *   cashReceived  — tiền khách đưa (bắt buộc nếu paymentMethod=COD)
     *   paymentMethod — COD|CARD|VNPAY (mặc định COD)
     */
    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<InvoiceDetailDTO> checkoutPOS(
            @Valid @RequestBody POSCheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        // ── Validate cash received ─────────────────────────────────────────
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

        // ── Create order (atomic: createOrder → confirmOrder → DELIVERED) ─
        OrderDTO completedOrder = orderService.createAndCompleteOrder(
            orderReq, userDetails.getUser().getId());

        // ── Validate cash after we know the total ─────────────────────────
        if (payMethod == PaymentMethod.COD) {
            BigDecimal cash = request.getCashReceived();
            if (cash == null || cash.compareTo(completedOrder.getGrandTotal()) < 0) {
                throw new BusinessRuleViolationException(
                    "Tiền khách đưa không đủ. Tổng cần trả: " + completedOrder.getGrandTotal());
            }
        }

        // ── Create Invoice ─────────────────────────────────────────────────
        // NOTE: getUsername() returns UUID (see CustomUserDetails) — use email as fallback
        User staff = userDetails.getUser();
        String staffName = (staff.getName() != null && !staff.getName().isBlank())
            ? staff.getName()
            : staff.getEmail(); // email is never null per DB constraint

        InvoiceDetailDTO invoice = invoiceService.createFromOrder(
            completedOrder,
            userDetails.getUser().getId(),
            staffName,
            request.getCashReceived(),
            payMethod
        );

        return ResponseEntity.ok(invoice);
    }

    private String safeStr(String value, String fallback) {
        return (value != null && !value.isBlank()) ? value : fallback;
    }

    // ── Inner request DTO ──────────────────────────────────────────────────
    @lombok.Data
    public static class POSCheckoutRequest {
        @jakarta.validation.Valid
        @jakarta.validation.constraints.NotEmpty(message = "Giỏ hàng không được trống")
        private java.util.List<secure_shop.backend.dto.order.request.OrderItemRequest> items;

        private PaymentMethod paymentMethod;

        /** Tiền khách đưa (bắt buộc khi paymentMethod=COD) */
        private BigDecimal cashReceived;
    }
}
