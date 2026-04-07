package secure_shop.backend.dto.product.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BulkImportRequest {
    
    @NotNull(message = "variantId is required")
    private UUID variantId;
    
    private UUID colorId;
    
    @NotEmpty(message = "imeiList cannot be empty")
    private List<String> imeiList;
}
