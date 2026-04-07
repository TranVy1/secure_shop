package secure_shop.backend.service;

import secure_shop.backend.dto.product.ProductAttributeDTO;
import java.util.List;
import java.util.UUID;

public interface ProductAttributeService {
    ProductAttributeDTO createAttribute(UUID productId, ProductAttributeDTO dto);
    ProductAttributeDTO getAttributeById(UUID attributeId);
    List<ProductAttributeDTO> getAttributesByProduct(UUID productId);
    List<ProductAttributeDTO> getAttributesByVariant(UUID variantId);
    ProductAttributeDTO updateAttribute(UUID attributeId, ProductAttributeDTO dto);
    void deleteAttribute(UUID attributeId);
}
