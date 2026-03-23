package secure_shop.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.Campaign;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, UUID> {
    
    @Query("SELECT c FROM Campaign c WHERE c.active = true AND c.startAt <= :now AND c.endAt >= :now")
    List<Campaign> findActiveCampaigns(Instant now);
}
