package secure_shop.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.dto.product.ProductAttributeDTO;
import secure_shop.backend.service.ProductAttributeService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-attributes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProductAttributeController {

    private final ProductAttributeService attributeService;

    @PostMapping("/product/{productId}")
    public ResponseEntity<ProductAttributeDTO> createAttribute(
            @PathVariable UUID productId,
            @Valid @RequestBody ProductAttributeDTO dto) {
        ProductAttributeDTO created = attributeService.createAttribute(productId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{attributeId}")
    public ResponseEntity<ProductAttributeDTO> getAttribute(@PathVariable UUID attributeId) {
        ProductAttributeDTO attribute = attributeService.getAttributeById(attributeId);
        return ResponseEntity.ok(attribute);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductAttributeDTO>> getAttributesByProduct(@PathVariable UUID productId) {
        List<ProductAttributeDTO> attributes = attributeService.getAttributesByProduct(productId);
        return ResponseEntity.ok(attributes);
    }

    @GetMapping("/variant/{variantId}")
    public ResponseEntity<List<ProductAttributeDTO>> getAttributesByVariant(@PathVariable UUID variantId) {
        List<ProductAttributeDTO> attributes = attributeService.getAttributesByVariant(variantId);
        return ResponseEntity.ok(attributes);
    }

    @PutMapping("/{attributeId}")
    public ResponseEntity<ProductAttributeDTO> updateAttribute(
            @PathVariable UUID attributeId,
            @Valid @RequestBody ProductAttributeDTO dto) {
        ProductAttributeDTO updated = attributeService.updateAttribute(attributeId, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{attributeId}")
    public ResponseEntity<Void> deleteAttribute(@PathVariable UUID attributeId) {
        attributeService.deleteAttribute(attributeId);
        return ResponseEntity.noContent().build();
    }
}
