package secure_shop.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.dto.barcode.BarcodeResponseDTO;
import secure_shop.backend.dto.barcode.CreateBarcodeRequest;
import secure_shop.backend.service.BarcodeService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/barcodes")
@RequiredArgsConstructor
public class BarcodeController {

    private final BarcodeService barcodeService;

    /** Admin tạo barcode thủ công */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BarcodeResponseDTO> createBarcode(@Valid @RequestBody CreateBarcodeRequest request) {
        return new ResponseEntity<>(barcodeService.createBarcode(request), HttpStatus.CREATED);
    }

    /** Admin/Staff tự động tạo barcode cho sản phẩm (dùng khi tạo sản phẩm mới) */
    @PostMapping("/auto-generate/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BarcodeResponseDTO> autoGenerate(
            @PathVariable UUID productId,
            @RequestParam(required = false, defaultValue = "") String sku) {
        return new ResponseEntity<>(barcodeService.autoGenerateForProduct(productId, sku), HttpStatus.CREATED);
    }

    /** Quét mã vạch tại POS */
    @GetMapping("/scan/{barcode}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BarcodeResponseDTO> getByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(barcodeService.getByBarcode(barcode));
    }

    /** Lấy tất cả barcodes của một sản phẩm */
    @GetMapping("/product/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BarcodeResponseDTO>> getByProduct(@PathVariable UUID productId) {
        return ResponseEntity.ok(barcodeService.getByProductId(productId));
    }

    /** Lấy toàn bộ barcodes (Admin) */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BarcodeResponseDTO>> getAllBarcodes() {
        return ResponseEntity.ok(barcodeService.getAllBarcodes());
    }

    /** Xóa barcode */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBarcode(@PathVariable Long id) {
        barcodeService.deleteBarcode(id);
        return ResponseEntity.noContent().build();
    }
}
