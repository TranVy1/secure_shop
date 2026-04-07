package secure_shop.backend.dto.product.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class GenerateRangeRequest {

    @NotNull(message = "variantId is required")
    private UUID variantId;
    
    private UUID colorId;
    
    @NotBlank(message = "prefix is required")
    private String prefix;
    
    @NotBlank(message = "startSequence is required")
    private String startSequence;
    
    @Min(value = 1, message = "quantity must be at least 1")
    private int quantity;
}
