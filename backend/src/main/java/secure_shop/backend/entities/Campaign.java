package secure_shop.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Campaign extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;
    
    @Column(nullable = false)
    private Instant startAt;
    
    @Column(nullable = false)
    private Instant endAt;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @OneToMany(mappedBy = "campaign", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<CampaignProduct> campaignProducts = new HashSet<>();
    
    public boolean isCurrentlyRunning() {
        Instant now = Instant.now();
        return Boolean.TRUE.equals(active) && now.isAfter(startAt) && now.isBefore(endAt);
    }
}
