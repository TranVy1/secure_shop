package secure_shop.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.dto.product.ProductColorDTO;
import secure_shop.backend.service.ProductColorService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-colors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProductColorController {

    private final ProductColorService colorService;

    @PostMapping("/product/{productId}")
    public ResponseEntity<ProductColorDTO> createColor(
            @PathVariable UUID productId,
            @Valid @RequestBody ProductColorDTO dto) {
        ProductColorDTO created = colorService.createColor(productId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{colorId}")
    public ResponseEntity<ProductColorDTO> getColor(@PathVariable UUID colorId) {
        ProductColorDTO color = colorService.getColorById(colorId);
        return ResponseEntity.ok(color);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductColorDTO>> getColorsByProduct(@PathVariable UUID productId) {
        List<ProductColorDTO> colors = colorService.getColorsByProduct(productId);
        return ResponseEntity.ok(colors);
    }

    @PutMapping("/{colorId}")
    public ResponseEntity<ProductColorDTO> updateColor(
            @PathVariable UUID colorId,
            @Valid @RequestBody ProductColorDTO dto) {
        ProductColorDTO updated = colorService.updateColor(colorId, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{colorId}")
    public ResponseEntity<Void> deleteColor(@PathVariable UUID colorId) {
        colorService.deleteColor(colorId);
        return ResponseEntity.noContent().build();
    }
}
