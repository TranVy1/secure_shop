package secure_shop.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "point_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order; // Nullable for non-order related point changes (e.g., admin bonus)

    @Column(nullable = false)
    private Integer pointChange; // Positive for earning, Negative for spending

    @Column(nullable = false, length = 255)
    private String reason;
}
