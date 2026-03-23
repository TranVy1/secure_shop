package secure_shop.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.entities.Campaign;
import secure_shop.backend.entities.CampaignProduct;
import secure_shop.backend.service.CampaignService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @GetMapping("/active")
    public ResponseEntity<List<Campaign>> getActiveCampaigns() {
        return ResponseEntity.ok(campaignService.getActiveCampaigns());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Campaign> createCampaign(@RequestBody Campaign campaign) {
        return ResponseEntity.ok(campaignService.createCampaign(campaign));
    }

    @PostMapping("/{campaignId}/products/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CampaignProduct> addProductToCampaign(
            @PathVariable UUID campaignId,
            @PathVariable UUID productId,
            @RequestBody Map<String, Object> body) {
        
        BigDecimal salePrice = new BigDecimal(body.get("salePrice").toString());
        Integer limit = body.containsKey("limitQuantity") ? Integer.parseInt(body.get("limitQuantity").toString()) : 0;
        
        return ResponseEntity.ok(campaignService.addProductToCampaign(campaignId, productId, salePrice, limit));
    }
}
