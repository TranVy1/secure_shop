package secure_shop.backend.dto.barcode;

import lombok.Builder;
import lombok.Data;
import secure_shop.backend.dto.product.ProductSummaryDTO;

import java.time.Instant;

@Data
@Builder
public class BarcodeResponseDTO {
    private Long id;
    private String barcode;
    private String serialNumber;
    private Instant createdAt;
    private ProductSummaryDTO product;
}
