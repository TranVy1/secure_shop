package secure_shop.backend.service;

import secure_shop.backend.dto.product.InventoryUnitDTO;
import secure_shop.backend.entities.InventoryUnit.InventoryUnitStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface InventoryUnitService {

    // Create & Bulk Import
    InventoryUnitDTO createUnit(UUID variantId, UUID colorId, String imeiSerial, 
                                Instant warrantyExpires, String warehouseLocation);

    /**
     * Bulk import IMEIs
     * @param variantId Variant ID
     * @param colorId Color ID (optional)
     * @param imeiList List of IMEIs to import (bảo đảm unique)
     * @return List of created units
     */
    List<InventoryUnitDTO> bulkImportIMEIs(UUID variantId, UUID colorId, List<String> imeiList);

    /**
     * Auto-generate IMEI range
     * @param variantId Variant ID
     * @param colorId Color ID (optional)
     * @param startSequence Starting sequence (e.g., 001)
     * @param quantity How many IMEIs to generate
     * @param prefix Optional prefix (e.g., "CAM-2024-")
     * @return List of generated units
     */
    List<InventoryUnitDTO> generateIMEIRange(UUID variantId, UUID colorId, 
                                             String prefix, String startSequence, int quantity);

    // Read
    InventoryUnitDTO getUnitById(UUID unitId);

    InventoryUnitDTO getUnitByIMEI(String imeiSerial);

    List<InventoryUnitDTO> getUnitsByVariant(UUID variantId);

    List<InventoryUnitDTO> getUnitsByVariantAndColor(UUID variantId, UUID colorId);

    List<InventoryUnitDTO> getAvailableUnits(UUID variantId);

    List<InventoryUnitDTO> getUnitsByStatus(InventoryUnitStatus status);

    List<String> getAvailableIMEIs(UUID variantId);

    // Update
    InventoryUnitDTO updateUnit(UUID unitId, InventoryUnitDTO dto);

    void updateUnitStatus(UUID unitId, InventoryUnitStatus newStatus);

    void updateWarranty(UUID unitId, Instant warrantyExpires);

    void updateWarehouseLocation(UUID unitId, String location);

    // Delete/Reserve/Release
    void deleteUnit(UUID unitId);

    void reserveUnit(UUID unitId, UUID orderItemId);

    void releaseUnit(UUID unitId);

    void sellUnit(UUID unitId, UUID orderItemId);

    void markDamaged(UUID unitId, String notes);

    // Count
    long countAvailableByVariant(UUID variantId);

    long countByStatus(InventoryUnitStatus status);

    long countByVariant(UUID variantId);

    // Utilities
    boolean imeiExists(String imeiSerial);

    void validateIMEIFormat(String imeiSerial);
}
