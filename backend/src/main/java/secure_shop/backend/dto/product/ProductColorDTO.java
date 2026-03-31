package secure_shop.backend.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * ProductColorDTO - DTO cho màu sắc sản phẩm
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductColorDTO implements Serializable {
    private UUID id;
    private String colorName;
    private String hexCode;
    private String imageUrl;
    private String description;
    private Boolean active;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long inventoryCount;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant createdAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant updatedAt;
}
