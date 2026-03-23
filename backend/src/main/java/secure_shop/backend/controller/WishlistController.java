package secure_shop.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.config.security.CustomUserDetails;
import secure_shop.backend.dto.product.ProductSummaryDTO;
import secure_shop.backend.service.WishlistService;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<Page<ProductSummaryDTO>> getMyWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ProductSummaryDTO> wishlist = wishlistService.getUserWishlist(userDetails.getUser().getId(), pageable);
        return ResponseEntity.ok(wishlist);
    }

    @PostMapping("/{productId}")
    public ResponseEntity<?> addProductToWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID productId) {
        wishlistService.addProductToWishlist(userDetails.getUser().getId(), productId);
        return ResponseEntity.ok(Map.of("message", "Đã thêm vào danh sách yêu thích"));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeProductFromWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID productId) {
        wishlistService.removeProductFromWishlist(userDetails.getUser().getId(), productId);
        return ResponseEntity.ok(Map.of("message", "Đã bỏ khỏi danh sách yêu thích"));
    }

    @GetMapping("/{productId}/check")
    public ResponseEntity<Map<String, Boolean>> checkWishlist(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID productId) {
        boolean exists = wishlistService.checkWishlist(userDetails.getUser().getId(), productId);
        return ResponseEntity.ok(Map.of("inWishlist", exists));
    }
}
