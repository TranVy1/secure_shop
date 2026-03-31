package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.dto.product.InventoryUnitDTO;
import secure_shop.backend.entities.InventoryUnit;
import secure_shop.backend.entities.InventoryUnit.InventoryUnitStatus;
import secure_shop.backend.entities.ProductColor;
import secure_shop.backend.entities.ProductVariant;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.mapper.InventoryUnitMapper;
import secure_shop.backend.repositories.*;
import secure_shop.backend.service.InventoryUnitService;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryUnitServiceImpl implements InventoryUnitService {

    private final InventoryUnitRepository inventoryUnitRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductColorRepository colorRepository;
    private final InventoryUnitMapper inventoryUnitMapper;

    @Override
    @Transactional
    public InventoryUnitDTO createUnit(UUID variantId, UUID colorId, String imeiSerial, 
                                       Instant warrantyExpires, String warehouseLocation) {
        validateIMEIFormat(imeiSerial);

        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));

        ProductColor color = (colorId != null) ? 
                colorRepository.findById(colorId).orElse(null) : null;

        if (imeiExists(imeiSerial)) {
            throw new IllegalArgumentException("IMEI '" + imeiSerial + "' đã tồn tại");
        }

        InventoryUnit unit = InventoryUnit.builder()
                .variant(variant)
                .color(color)
                .imeiSerial(imeiSerial)
                .unitStatus(InventoryUnitStatus.AVAILABLE)
                .warrantyExpiresAt(warrantyExpires)
                .warehouseLocation(warehouseLocation)
                .build();

        InventoryUnit saved = inventoryUnitRepository.save(unit);
        return inventoryUnitMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public List<InventoryUnitDTO> bulkImportIMEIs(UUID variantId, UUID colorId, List<String> imeiList) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));

        ProductColor color = (colorId != null) ? 
                colorRepository.findById(colorId).orElse(null) : null;

        // Kiểm tra duplicates trong list
        Set<String> uniqueIMEIs = new HashSet<>(imeiList);
        if (uniqueIMEIs.size() != imeiList.size()) {
            throw new IllegalArgumentException("Danh sách IMEI có giá trị trùng lặp");
        }

        // Kiểm tra xem IMEIs đã tồn tại trong DB chưa
        for (String imei : imeiList) {
            if (imeiExists(imei)) {
                throw new IllegalArgumentException("IMEI '" + imei + "' đã tồn tại");
            }
        }

        List<InventoryUnit> units = imeiList.stream()
                .map(imei -> InventoryUnit.builder()
                        .variant(variant)
                        .color(color)
                        .imeiSerial(imei)
                        .unitStatus(InventoryUnitStatus.AVAILABLE)
                        .build())
                .collect(Collectors.toList());

        List<InventoryUnit> saved = inventoryUnitRepository.saveAll(units);
        return inventoryUnitMapper.toDTOList(saved);
    }

    @Override
    @Transactional
    public List<InventoryUnitDTO> generateIMEIRange(UUID variantId, UUID colorId,
                                                    String prefix, String startSequence, int quantity) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));

        ProductColor color = (colorId != null) ? 
                colorRepository.findById(colorId).orElse(null) : null;

        List<InventoryUnit> units = new ArrayList<>();
        long startNum = Long.parseLong(startSequence);

        for (int i = 0; i < quantity; i++) {
            String sequence = String.format("%0" + startSequence.length() + "d", startNum + i);
            String imei = prefix != null && !prefix.isEmpty() ? 
                    prefix + sequence : sequence;

            if (imeiExists(imei)) {
                throw new IllegalArgumentException("IMEI '" + imei + "' đã tồn tại");
            }

            InventoryUnit unit = InventoryUnit.builder()
                    .variant(variant)
                    .color(color)
                    .imeiSerial(imei)
                    .unitStatus(InventoryUnitStatus.AVAILABLE)
                    .build();
            units.add(unit);
        }

        List<InventoryUnit> saved = inventoryUnitRepository.saveAll(units);
        return inventoryUnitMapper.toDTOList(saved);
    }

    @Override
    public InventoryUnitDTO getUnitById(UUID unitId) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));
        return inventoryUnitMapper.toDTO(unit);
    }

    @Override
    public InventoryUnitDTO getUnitByIMEI(String imeiSerial) {
        InventoryUnit unit = inventoryUnitRepository.findByImeiSerial(imeiSerial)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", "IMEI: " + imeiSerial));
        return inventoryUnitMapper.toDTO(unit);
    }

    @Override
    public List<InventoryUnitDTO> getUnitsByVariant(UUID variantId) {
        List<InventoryUnit> units = inventoryUnitRepository.findByVariantId(variantId);
        return inventoryUnitMapper.toDTOList(units);
    }

    @Override
    public List<InventoryUnitDTO> getUnitsByVariantAndColor(UUID variantId, UUID colorId) {
        List<InventoryUnit> units = inventoryUnitRepository.findByVariantIdAndColorId(variantId, colorId);
        return inventoryUnitMapper.toDTOList(units);
    }

    @Override
    public List<InventoryUnitDTO> getAvailableUnits(UUID variantId) {
        List<InventoryUnit> units = inventoryUnitRepository.findAvailableByVariant(variantId);
        return inventoryUnitMapper.toDTOList(units);
    }

    @Override
    public List<InventoryUnitDTO> getUnitsByStatus(InventoryUnitStatus status) {
        List<InventoryUnit> units = inventoryUnitRepository.findByUnitStatus(status);
        return inventoryUnitMapper.toDTOList(units);
    }

    @Override
    public List<String> getAvailableIMEIs(UUID variantId) {
        return inventoryUnitRepository.findAvailableImeisByVariant(variantId);
    }

    @Override
    @Transactional
    public InventoryUnitDTO updateUnit(UUID unitId, InventoryUnitDTO dto) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));

        unit.setNotes(dto.getNotes());
        unit.setWarehouseLocation(dto.getWarehouseLocation());
        unit.setWarrantyExpiresAt(dto.getWarrantyExpiresAt());

        InventoryUnit updated = inventoryUnitRepository.save(unit);
        return inventoryUnitMapper.toDTO(updated);
    }

    @Override
    @Transactional
    public void updateUnitStatus(UUID unitId, InventoryUnitStatus newStatus) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));
        unit.setUnitStatus(newStatus);
        inventoryUnitRepository.save(unit);
    }

    @Override
    @Transactional
    public void updateWarranty(UUID unitId, Instant warrantyExpires) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));
        unit.setWarrantyExpiresAt(warrantyExpires);
        inventoryUnitRepository.save(unit);
    }

    @Override
    @Transactional
    public void updateWarehouseLocation(UUID unitId, String location) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));
        unit.setWarehouseLocation(location);
        inventoryUnitRepository.save(unit);
    }

    @Override
    @Transactional
    public void deleteUnit(UUID unitId) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));
        inventoryUnitRepository.delete(unit);
    }

    @Override
    @Transactional
    public void reserveUnit(UUID unitId, UUID orderItemId) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));

        unit.reserve();
        // Note: OrderItem relationship will be managed via OrderItemService
        inventoryUnitRepository.save(unit);
    }

    @Override
    @Transactional
    public void releaseUnit(UUID unitId) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));

        if (unit.getUnitStatus() == InventoryUnitStatus.RESERVED) {
            unit.setUnitStatus(InventoryUnitStatus.AVAILABLE);
            unit.setOrderItem(null);
            inventoryUnitRepository.save(unit);
        }
    }

    @Override
    @Transactional
    public void sellUnit(UUID unitId, UUID orderItemId) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));

        unit.sell();
        // Note: OrderItem relationship will be managed via OrderItemService
        inventoryUnitRepository.save(unit);
    }

    @Override
    @Transactional
    public void markDamaged(UUID unitId, String notes) {
        InventoryUnit unit = inventoryUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryUnit", unitId));
        unit.markDamaged(notes);
        inventoryUnitRepository.save(unit);
    }

    @Override
    public long countAvailableByVariant(UUID variantId) {
        return inventoryUnitRepository.countByVariantIdAndUnitStatus(variantId, InventoryUnitStatus.AVAILABLE);
    }

    @Override
    public long countByStatus(InventoryUnitStatus status) {
        return inventoryUnitRepository.countByUnitStatus(status);
    }

    @Override
    public long countByVariant(UUID variantId) {
        return inventoryUnitRepository.countByVariantId(variantId);
    }

    @Override
    public boolean imeiExists(String imeiSerial) {
        return inventoryUnitRepository.findByImeiSerial(imeiSerial).isPresent();
    }

    @Override
    public void validateIMEIFormat(String imeiSerial) {
        if (imeiSerial == null || imeiSerial.trim().isEmpty()) {
            throw new IllegalArgumentException("IMEI không được để trống");
        }
        if (!imeiSerial.matches("^[A-Z0-9-]+$")) {
            throw new IllegalArgumentException("IMEI chỉ được chứa chữ hoa, số và '-'");
        }
    }
}
