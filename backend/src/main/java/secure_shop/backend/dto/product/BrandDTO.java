package secure_shop.backend.dto.product;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandDTO {
    private Long id;
    private String name;
    private Integer productCount; // Number of products with this brand

    // Constructor for ProductRepository query (backward compatibility)
    public BrandDTO(Long id, String name) {
        this.id = id;
        this.name = name;
        this.productCount = null; // Will be null in ProductSummaryDTO context
    }
}