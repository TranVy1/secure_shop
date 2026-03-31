package secure_shop.backend.dto.product;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * InventoryUnitDTO - DTO cho quản lý IMEI/Serial Numbers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryUnitDTO implements Serializable {
    private UUID id;
    private String imeiSerial;
    private String unitStatus; // AVAILABLE, RESERVED, SOLD, RETURNED, DAMAGED
    private Instant warrantyExpiresAt;
    private String notes;
    private String warehouseLocation;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private UUID variantId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private UUID colorId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant createdAt;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Instant updatedAt;
}
