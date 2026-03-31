package secure_shop.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.dto.product.ProductVariantDTO;
import secure_shop.backend.service.ProductVariantService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-variants")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProductVariantController {

    private final ProductVariantService variantService;

    @PostMapping("/product/{productId}")
    public ResponseEntity<ProductVariantDTO> createVariant(
            @PathVariable UUID productId,
            @Valid @RequestBody ProductVariantDTO dto) {
        ProductVariantDTO created = variantService.createVariant(productId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{variantId}")
    public ResponseEntity<ProductVariantDTO> getVariant(@PathVariable UUID variantId) {
        ProductVariantDTO variant = variantService.getVariantById(variantId);
        return ResponseEntity.ok(variant);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductVariantDTO>> getVariantsByProduct(@PathVariable UUID productId) {
        List<ProductVariantDTO> variants = variantService.getVariantsByProduct(productId);
        return ResponseEntity.ok(variants);
    }

    @GetMapping("/product/{productId}/type/{variantType}")
    public ResponseEntity<List<ProductVariantDTO>> getVariantsByType(
            @PathVariable UUID productId,
            @PathVariable String variantType) {
        List<ProductVariantDTO> variants = variantService.getVariantsByType(productId, variantType);
        return ResponseEntity.ok(variants);
    }

    @GetMapping("/product/{productId}/type/{variantType}/value/{variantValue}")
    public ResponseEntity<ProductVariantDTO> getByTypeValue(
            @PathVariable UUID productId,
            @PathVariable String variantType,
            @PathVariable String variantValue) {
        ProductVariantDTO variant = variantService.getByProductAndTypeValue(productId, variantType, variantValue);
        return ResponseEntity.ok(variant);
    }

    @PutMapping("/{variantId}")
    public ResponseEntity<ProductVariantDTO> updateVariant(
            @PathVariable UUID variantId,
            @Valid @RequestBody ProductVariantDTO dto) {
        ProductVariantDTO updated = variantService.updateVariant(variantId, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{variantId}")
    public ResponseEntity<Void> deleteVariant(@PathVariable UUID variantId) {
        variantService.deleteVariant(variantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{variantId}/restore")
    public ResponseEntity<Void> restoreVariant(@PathVariable UUID variantId) {
        variantService.restoreVariant(variantId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/product/{productId}/types")
    public ResponseEntity<List<String>> getVariantTypes(@PathVariable UUID productId) {
        List<String> types = variantService.getUniqueVariantTypes(productId);
        return ResponseEntity.ok(types);
    }
}
