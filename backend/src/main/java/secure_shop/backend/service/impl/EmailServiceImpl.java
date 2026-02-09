package secure_shop.backend.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import secure_shop.backend.entities.Order;
import secure_shop.backend.entities.OrderItem;
import secure_shop.backend.service.EmailService;
 

import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    @Value("${app.frontend.base-url:https://secure-shop.example}")
    private String frontendBaseUrl;

    @Override
    public void sendResetPasswordEmail(String to, String resetLink) throws MessagingException, IOException {
        Context context = new Context();
        context.setVariable("email", to);
        context.setVariable("resetLink", resetLink);

        String htmlContent = templateEngine.process("reset-password", context);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("support@myshop.com");
        helper.setTo(to);
        helper.setSubject("🔐 Đặt lại mật khẩu - SecureShop");
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    @Override
    public void sendVerificationEmail(String to, String verificationLink) throws MessagingException, IOException {
        Context context = new Context();
        context.setVariable("email", to);
        context.setVariable("verificationLink", verificationLink);

        String htmlContent = templateEngine.process("email-verification", context);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("support@myshop.com");
        helper.setTo(to);
        helper.setSubject("✉️ Xác thực tài khoản - SecureShop");
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    @Override
    public void sendOrderConfirmationEmail(Order order) throws MessagingException, IOException {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            log.warn("Skip sending order email: missing user/email. orderId={}", order != null ? order.getId() : null);
            return;
        }

        Context context = new Context(Locale.forLanguageTag("vi-VN"));
        context.setVariable("orderId", order.getId());
        context.setVariable("orderName", getOrderName(order));
        context.setVariable("customerName", order.getUser().getName());
        String createdAtStr = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
            .withLocale(Locale.forLanguageTag("vi-VN"))
            .withZone(ZoneId.systemDefault())
            .format(order.getCreatedAt());
        context.setVariable("createdAt", createdAtStr);

        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));
        context.setVariable("subTotal", formatCurrency(order.getSubTotal(), currencyFormat));
        context.setVariable("discountTotal", formatCurrency(order.getDiscountTotal(), currencyFormat));
        context.setVariable("shippingFee", formatCurrency(order.getShippingFee(), currencyFormat));
        context.setVariable("grandTotal", formatCurrency(order.getGrandTotal(), currencyFormat));
        context.setVariable("hasPaid", order.getHasPaid() ? "Đã thanh toán" : "Chưa thanh toán");
        
        // Translate Payment Status
        String paymentStatusVi = switch (order.getPaymentStatus()) {
            case PAID -> "Đã thanh toán";
            case UNPAID -> "Chưa thanh toán";
            case REFUNDED -> "Đã hoàn tiền";
            case FAILED -> "Thất bại";
            default -> "Chưa thanh toán";
        };
        context.setVariable("paymentStatus", paymentStatusVi);
        context.setVariable("isPaidLabel", paymentStatusVi);

        // Translate Order Status
        String orderStatusVi = switch (order.getStatus()) {
            case PENDING -> "Chờ xử lý";
            case CONFIRMED -> "Đã xác nhận";
            case WAITING_FOR_DELIVERY -> "Chờ giao hàng";
            case IN_TRANSIT -> "Đang giao hàng";
            case DELIVERED -> "Đã giao hàng";
            case CANCELLED -> "Đã hủy";
            default -> order.getStatus().name();
        };
        context.setVariable("orderStatus", orderStatusVi);

        // Translate Payment Method
        String paymentMethodVi = "Chưa xác định";
        if (order.getPayment() != null && order.getPayment().getMethod() != null) {
            paymentMethodVi = switch (order.getPayment().getMethod()) {
                case COD -> "Thanh toán khi nhận hàng (COD)";
                case E_WALLET -> "Ví điện tử (VNPay/Momo)";
                case BANK_TRANSFER -> "Chuyển khoản ngân hàng";
                default -> order.getPayment().getMethod().name();
            };
        }
        context.setVariable("paymentMethod", paymentMethodVi);
        String orderLink = frontendBaseUrl.replaceAll("/$", "") + "/orders/" + order.getId();
        context.setVariable("orderLink", orderLink);

        // Shipping address map -> join for display
        if (order.getShippingAddress() != null && !order.getShippingAddress().isEmpty()) {
            StringBuilder addressBuilder = new StringBuilder();
            order.getShippingAddress().forEach((k, v) -> {
                if (v != null && !v.isBlank()) {
                    addressBuilder.append(v).append(", ");
                }
            });
            String address = addressBuilder.length() > 2 ? addressBuilder.substring(0, addressBuilder.length() - 2) : "";
            context.setVariable("shippingAddress", address);
        } else {
            context.setVariable("shippingAddress", "(Không có địa chỉ)");
        }

        // Order items
        context.setVariable("items", order.getOrderItems().stream().map(this::mapItem).toList());

        try {
            String htmlContent = templateEngine.process("order-confirmation", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("support@myshop.com");
            helper.setTo(order.getUser().getEmail());
            helper.setSubject("🛒 Xác nhận đơn hàng [" + getOrderName(order) + "] - SecureShop");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Order email sent to {} for orderId={}", order.getUser().getEmail(), order.getId());
        } catch (Exception ex) {
            log.error("Failed to send order email for orderId={}", order.getId(), ex);
            if (ex instanceof MessagingException me) throw me;
            if (ex instanceof IOException ioe) throw ioe;
        }
    }

    @Override
    public void sendThankYouEmail(Order order) throws MessagingException, IOException {
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            log.warn("Skip sending thank you email: missing user/email. orderId={}", order != null ? order.getId() : null);
            return;
        }

        Context context = new Context(Locale.forLanguageTag("vi-VN"));
        context.setVariable("orderId", order.getId());
        context.setVariable("orderName", getOrderName(order));
        context.setVariable("customerName", order.getUser().getName());
        
        String orderLink = frontendBaseUrl.replaceAll("/$", "") + "/orders/" + order.getId();
        context.setVariable("orderLink", orderLink);

        try {
            String htmlContent = templateEngine.process("thank-you", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("support@myshop.com");
            helper.setTo(order.getUser().getEmail());
            helper.setSubject("💕 Cảm ơn bạn đã mua [" + getOrderName(order) + "] tại SecureShop");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Thank you email sent to {} for orderId={}", order.getUser().getEmail(), order.getId());
        } catch (Exception ex) {
            log.error("Failed to send thank you email for orderId={}", order.getId(), ex);
            if (ex instanceof MessagingException me) throw me;
            if (ex instanceof IOException ioe) throw ioe;
        }
    }

    

    private String getOrderName(Order order) {
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            return "#" + order.getId().toString().substring(0, 8);
        }
        var items = order.getOrderItems().stream().toList();
        String firstItemName = items.get(0).getProduct() != null ? items.get(0).getProduct().getName() : "Sản phẩm";
        if (items.size() > 1) {
            return firstItemName + " và " + (items.size() - 1) + " sản phẩm khác";
        }
        return firstItemName;
    }

    private String formatCurrency(BigDecimal value, NumberFormat nf) {
        if (value == null) return nf.format(0);
        return nf.format(value);
    }

    private ItemView mapItem(OrderItem item) {
        return new ItemView(
                item.getProduct() != null ? item.getProduct().getName() : "(Sản phẩm)",
                item.getQuantity() != null ? item.getQuantity() : 0,
                item.getUnitPrice(),
                item.getLineTotal(),
                item.getProduct() != null ? item.getProduct().getSku() : null
        );
    }

    private record ItemView(String name, Integer quantity, BigDecimal unitPrice, BigDecimal lineTotal, String sku) {}
}