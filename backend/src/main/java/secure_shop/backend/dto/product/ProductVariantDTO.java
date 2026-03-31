package secure_shop.backend.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * ProductVariantDTO - DTO cho biến thể sản phẩm
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantDTO implements Serializable {
    private UUID id;
    private String variantType;
    private String variantValue;
    private String sku;
    private BigDecimal priceAdjustment;
    private String description;
    private String imageUrl;
    private Boolean active;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long inventoryCount;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant createdAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant updatedAt;
}
