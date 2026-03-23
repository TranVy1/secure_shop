package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.entities.Campaign;
import secure_shop.backend.entities.CampaignProduct;
import secure_shop.backend.entities.Product;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.repositories.CampaignProductRepository;
import secure_shop.backend.repositories.CampaignRepository;
import secure_shop.backend.repositories.ProductRepository;
import secure_shop.backend.service.CampaignService;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CampaignServiceImpl implements CampaignService {

    private final CampaignRepository campaignRepository;
    private final CampaignProductRepository campaignProductRepository;
    private final ProductRepository productRepository;

    @Override
    public Campaign createCampaign(Campaign campaign) {
        return campaignRepository.save(campaign);
    }

    @Override
    public CampaignProduct addProductToCampaign(UUID campaignId, UUID productId, BigDecimal salePrice, Integer limitQuantity) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", campaignId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        CampaignProduct cp = CampaignProduct.builder()
                .campaign(campaign)
                .product(product)
                .salePrice(salePrice)
                .limitQuantity(limitQuantity != null ? limitQuantity : 0)
                .build();
        return campaignProductRepository.save(cp);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Campaign> getActiveCampaigns() {
        return campaignRepository.findActiveCampaigns(Instant.now());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BigDecimal> getActiveCampaignPriceForProduct(UUID productId) {
        List<Campaign> activeCampaigns = getActiveCampaigns();
        for (Campaign c : activeCampaigns) {
            Optional<CampaignProduct> cp = campaignProductRepository.findByCampaignIdAndProductId(c.getId(), productId);
            if (cp.isPresent()) {
                // If there's a limit, ensure sold quantity is less than limit
                CampaignProduct campaignProduct = cp.get();
                if (campaignProduct.getLimitQuantity() == 0 || campaignProduct.getSoldQuantity() < campaignProduct.getLimitQuantity()) {
                    return Optional.of(campaignProduct.getSalePrice());
                }
            }
        }
        return Optional.empty();
    }
}
