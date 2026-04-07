package secure_shop.backend.service;

import secure_shop.backend.dto.product.ProductColorDTO;
import java.util.List;
import java.util.UUID;

public interface ProductColorService {
    ProductColorDTO createColor(UUID productId, ProductColorDTO dto);
    ProductColorDTO getColorById(UUID colorId);
    List<ProductColorDTO> getColorsByProduct(UUID productId);
    ProductColorDTO updateColor(UUID colorId, ProductColorDTO dto);
    void deleteColor(UUID colorId);
}
