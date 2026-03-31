package secure_shop.backend.mapper;

import org.springframework.stereotype.Component;
import secure_shop.backend.dto.product.InventoryUnitDTO;
import secure_shop.backend.entities.InventoryUnit;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class InventoryUnitMapper {

    public InventoryUnitDTO toDTO(InventoryUnit entity) {
        if (entity == null) return null;

        return InventoryUnitDTO.builder()
                .id(entity.getId())
                .imeiSerial(entity.getImeiSerial())
                .unitStatus(entity.getUnitStatus() != null ? entity.getUnitStatus().toString() : null)
                .warrantyExpiresAt(entity.getWarrantyExpiresAt())
                .notes(entity.getNotes())
                .warehouseLocation(entity.getWarehouseLocation())
                .variantId(entity.getVariant() != null ? entity.getVariant().getId() : null)
                .colorId(entity.getColor() != null ? entity.getColor().getId() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public InventoryUnit toEntity(InventoryUnitDTO dto) {
        if (dto == null) return null;

        InventoryUnit.InventoryUnitStatus status = null;
        if (dto.getUnitStatus() != null) {
            try {
                status = InventoryUnit.InventoryUnitStatus.valueOf(dto.getUnitStatus());
            } catch (IllegalArgumentException e) {
                status = InventoryUnit.InventoryUnitStatus.AVAILABLE;
            }
        }

        InventoryUnit unit = InventoryUnit.builder()
                .imeiSerial(dto.getImeiSerial())
                .unitStatus(status)
                .warrantyExpiresAt(dto.getWarrantyExpiresAt())
                .notes(dto.getNotes())
                .warehouseLocation(dto.getWarehouseLocation())
                .build();
        
        if (dto.getId() != null) {
            unit.setId(dto.getId());
        }
        return unit;
    }

    public List<InventoryUnitDTO> toDTOList(List<InventoryUnit> entities) {
        if (entities == null) return Collections.emptyList();
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<InventoryUnit> toEntityList(List<InventoryUnitDTO> dtos) {
        if (dtos == null) return Collections.emptyList();
        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
}
