package secure_shop.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "barcodes", indexes = {
    @Index(name = "idx_barcodes_code", columnList = "barcode", unique = true),
    @Index(name = "idx_barcodes_product", columnList = "product_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Barcode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String barcode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(length = 100)
    private String serialNumber; // optional

    @Builder.Default
    @Column(nullable = false, updatable = false, columnDefinition = "datetimeoffset(6)")
    private Instant createdAt = Instant.now();
}
