package secure_shop.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import secure_shop.backend.dto.product.ProductSummaryDTO;

import java.util.UUID;

public interface WishlistService {
    Page<ProductSummaryDTO> getUserWishlist(UUID userId, Pageable pageable);
    void addProductToWishlist(UUID userId, UUID productId);
    void removeProductFromWishlist(UUID userId, UUID productId);
    boolean checkWishlist(UUID userId, UUID productId);
}
