package secure_shop.backend.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class MockPaymentRequest {
    @NotNull(message = "Order ID is required")
    private UUID orderId;

    private String paymentMethod; // Optional: to simulate specific method overriding
}
