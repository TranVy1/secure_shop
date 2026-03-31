package secure_shop.backend.service;

import secure_shop.backend.dto.product.ProductVariantDTO;
import secure_shop.backend.entities.ProductVariant;

import java.util.List;
import java.util.UUID;

public interface ProductVariantService {
    
    // Create
    ProductVariantDTO createVariant(UUID productId, ProductVariantDTO dto);

    // Read
    ProductVariantDTO getVariantById(UUID variantId);
    
    List<ProductVariantDTO> getVariantsByProduct(UUID productId);
    
    List<ProductVariantDTO> getVariantsByType(UUID productId, String variantType);
    
    ProductVariantDTO getByProductAndTypeValue(UUID productId, String type, String value);

    // Update
    ProductVariantDTO updateVariant(UUID variantId, ProductVariantDTO dto);

    // Delete
    void deleteVariant(UUID variantId);
    
    void restoreVariant(UUID variantId);

    // Other
    long countVariants(UUID productId);
    
    boolean skuExists(String sku);
    
    List<String> getUniqueVariantTypes(UUID productId);
}
