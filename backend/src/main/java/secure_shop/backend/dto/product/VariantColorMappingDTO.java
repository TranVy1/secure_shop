package secure_shop.backend.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * VariantColorMappingDTO - DTO cho mapping giữa Variant × Color
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantColorMappingDTO implements Serializable {
    private UUID id;
    private String sku;
    private BigDecimal colorPriceAdjustment;
    private String description;
    private String imageUrl;
    private Boolean active;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private UUID variantId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private ProductVariantDTO variant;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private UUID colorId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private ProductColorDTO color;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private BigDecimal totalPriceAdjustment; // variant adjustment + color adjustment

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long inventoryCount;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant createdAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant updatedAt;
}
