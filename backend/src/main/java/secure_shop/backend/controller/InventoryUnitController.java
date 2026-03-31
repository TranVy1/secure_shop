package secure_shop.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.dto.product.InventoryUnitDTO;
import secure_shop.backend.entities.InventoryUnit.InventoryUnitStatus;
import secure_shop.backend.service.InventoryUnitService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory-units")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class InventoryUnitController {

    private final InventoryUnitService inventoryUnitService;

    // ===== Create =====
    @PostMapping
    public ResponseEntity<InventoryUnitDTO> createUnit(
            @Valid @RequestBody InventoryUnitDTO dto) {
        InventoryUnitDTO created = inventoryUnitService.createUnit(
                dto.getVariantId(),
                dto.getColorId(),
                dto.getImeiSerial(),
                dto.getWarrantyExpiresAt(),
                dto.getWarehouseLocation());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ===== Bulk Import IMEIs =====
    @PostMapping("/bulk-import")
    public ResponseEntity<Map<String, Object>> bulkImportIMEIs(
            @RequestParam UUID variantId,
            @RequestParam(required = false) UUID colorId,
            @RequestBody List<String> imeiList) {
        List<InventoryUnitDTO> created = inventoryUnitService.bulkImportIMEIs(variantId, colorId, imeiList);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "count", created.size(),
                "units", created
        ));
    }

    // ===== Generate IMEI Range =====
    @PostMapping("/generate-range")
    public ResponseEntity<Map<String, Object>> generateIMEIRange(
            @RequestParam UUID variantId,
            @RequestParam(required = false) UUID colorId,
            @RequestParam String prefix,
            @RequestParam String startSequence,
            @RequestParam int quantity) {
        List<InventoryUnitDTO> generated = inventoryUnitService.generateIMEIRange(
                variantId, colorId, prefix, startSequence, quantity);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "count", generated.size(),
                "units", generated
        ));
    }

    // ===== Read =====
    @GetMapping("/{unitId}")
    public ResponseEntity<InventoryUnitDTO> getUnit(@PathVariable UUID unitId) {
        InventoryUnitDTO unit = inventoryUnitService.getUnitById(unitId);
        return ResponseEntity.ok(unit);
    }

    @GetMapping("/imei/{imeiSerial}")
    public ResponseEntity<InventoryUnitDTO> getByIMEI(@PathVariable String imeiSerial) {
        InventoryUnitDTO unit = inventoryUnitService.getUnitByIMEI(imeiSerial);
        return ResponseEntity.ok(unit);
    }

    @GetMapping("/variant/{variantId}")
    public ResponseEntity<List<InventoryUnitDTO>> getByVariant(@PathVariable UUID variantId) {
        List<InventoryUnitDTO> units = inventoryUnitService.getUnitsByVariant(variantId);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/variant/{variantId}/color/{colorId}")
    public ResponseEntity<List<InventoryUnitDTO>> getByVariantAndColor(
            @PathVariable UUID variantId,
            @PathVariable UUID colorId) {
        List<InventoryUnitDTO> units = inventoryUnitService.getUnitsByVariantAndColor(variantId, colorId);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/variant/{variantId}/available")
    public ResponseEntity<List<InventoryUnitDTO>> getAvailable(@PathVariable UUID variantId) {
        List<InventoryUnitDTO> units = inventoryUnitService.getAvailableUnits(variantId);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/variant/{variantId}/imeis")
    public ResponseEntity<List<String>> getAvailableIMEIs(@PathVariable UUID variantId) {
        List<String> imeis = inventoryUnitService.getAvailableIMEIs(variantId);
        return ResponseEntity.ok(imeis);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<InventoryUnitDTO>> getByStatus(@PathVariable String status) {
        InventoryUnitStatus unitStatus = InventoryUnitStatus.valueOf(status.toUpperCase());
        List<InventoryUnitDTO> units = inventoryUnitService.getUnitsByStatus(unitStatus);
        return ResponseEntity.ok(units);
    }

    // ===== Update =====
    @PutMapping("/{unitId}")
    public ResponseEntity<InventoryUnitDTO> updateUnit(
            @PathVariable UUID unitId,
            @Valid @RequestBody InventoryUnitDTO dto) {
        InventoryUnitDTO updated = inventoryUnitService.updateUnit(unitId, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{unitId}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable UUID unitId,
            @RequestParam String status) {
        InventoryUnitStatus newStatus = InventoryUnitStatus.valueOf(status.toUpperCase());
        inventoryUnitService.updateUnitStatus(unitId, newStatus);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{unitId}/location")
    public ResponseEntity<Void> updateLocation(
            @PathVariable UUID unitId,
            @RequestParam String location) {
        inventoryUnitService.updateWarehouseLocation(unitId, location);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{unitId}/damage")
    public ResponseEntity<Void> markDamaged(
            @PathVariable UUID unitId,
            @RequestParam(required = false) String notes) {
        inventoryUnitService.markDamaged(unitId, notes);
        return ResponseEntity.ok().build();
    }

    // ===== Delete =====
    @DeleteMapping("/{unitId}")
    public ResponseEntity<Void> deleteUnit(@PathVariable UUID unitId) {
        inventoryUnitService.deleteUnit(unitId);
        return ResponseEntity.noContent().build();
    }

    // ===== Statistics =====
    @GetMapping("/stats/variant/{variantId}")
    public ResponseEntity<Map<String, Long>> getVariantStats(@PathVariable UUID variantId) {
        return ResponseEntity.ok(Map.of(
                "available", inventoryUnitService.countAvailableByVariant(variantId),
                "total", inventoryUnitService.countByVariant(variantId)
        ));
    }

    @GetMapping("/stats/status/{status}")
    public ResponseEntity<Map<String, Long>> getStatusStats(@PathVariable String status) {
        InventoryUnitStatus unitStatus = InventoryUnitStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(Map.of(
                "count", inventoryUnitService.countByStatus(unitStatus)
        ));
    }
}
