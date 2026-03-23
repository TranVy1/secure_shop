package secure_shop.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.CampaignProduct;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CampaignProductRepository extends JpaRepository<CampaignProduct, UUID> {
    Optional<CampaignProduct> findByCampaignIdAndProductId(UUID campaignId, UUID productId);
}
