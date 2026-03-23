package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.dto.product.ProductSummaryDTO;
import secure_shop.backend.entities.Product;
import secure_shop.backend.entities.User;
import secure_shop.backend.entities.WishlistItem;
import secure_shop.backend.exception.BusinessRuleViolationException;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.mapper.ProductMapper;
import secure_shop.backend.repositories.ProductRepository;
import secure_shop.backend.repositories.UserRepository;
import secure_shop.backend.repositories.WishlistRepository;
import secure_shop.backend.service.WishlistService;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductSummaryDTO> getUserWishlist(UUID userId, Pageable pageable) {
        return wishlistRepository.findByUserId(userId, pageable)
                .map(item -> productMapper.toProductSummaryDTO(item.getProduct()));
    }

    @Override
    public void addProductToWishlist(UUID userId, UUID productId) {
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new BusinessRuleViolationException("Product is already in wishlist");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        WishlistItem item = WishlistItem.builder()
                .user(user)
                .product(product)
                .build();

        wishlistRepository.save(item);
    }

    @Override
    public void removeProductFromWishlist(UUID userId, UUID productId) {
        if (!wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ResourceNotFoundException("WishlistItem", productId);
        }
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkWishlist(UUID userId, UUID productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }
}
