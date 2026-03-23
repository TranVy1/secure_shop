package secure_shop.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "campaign_products", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"campaign_id", "product_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignProduct extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false)
    private BigDecimal salePrice;
    
    @Column(nullable = false)
    @Builder.Default
    private Integer limitQuantity = 0; // 0 means no limit
    
    @Column(nullable = false)
    @Builder.Default
    private Integer soldQuantity = 0;
}
