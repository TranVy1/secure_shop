package secure_shop.backend.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * ProductAttributeDTO - DTO cho đặc tính/thông số sản phẩm
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductAttributeDTO implements Serializable {
    private UUID id;
    private String attributeKey;
    private String attributeName;
    private String attributeValue;
    private String description;
    private String valueType; // string, number, boolean, select
    private String unit; // m, MP, kg, etc.

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private UUID variantId; // null = global attribute

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant createdAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant updatedAt;
}
