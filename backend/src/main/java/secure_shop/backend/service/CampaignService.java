package secure_shop.backend.service;

import secure_shop.backend.entities.Campaign;
import secure_shop.backend.entities.CampaignProduct;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CampaignService {
    Campaign createCampaign(Campaign campaign);
    CampaignProduct addProductToCampaign(UUID campaignId, UUID productId, BigDecimal salePrice, Integer limitQuantity);
    List<Campaign> getActiveCampaigns();
    Optional<BigDecimal> getActiveCampaignPriceForProduct(UUID productId);
}
