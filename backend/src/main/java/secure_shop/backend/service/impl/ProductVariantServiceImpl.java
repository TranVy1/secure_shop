package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.dto.product.ProductVariantDTO;
import secure_shop.backend.entities.Product;
import secure_shop.backend.entities.ProductVariant;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.mapper.ProductVariantMapper;
import secure_shop.backend.repositories.ProductRepository;
import secure_shop.backend.repositories.ProductVariantRepository;
import secure_shop.backend.service.ProductVariantService;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductVariantServiceImpl implements ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final ProductVariantMapper variantMapper;

    @Override
    @Transactional
    public ProductVariantDTO createVariant(UUID productId, ProductVariantDTO dto) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        // Check if SKU exists
        if (variantRepository.findBySku(dto.getSku()).isPresent()) {
            throw new IllegalArgumentException("SKU '" + dto.getSku() + "' đã tồn tại");
        }

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .variantType(dto.getVariantType())
                .variantValue(dto.getVariantValue())
                .sku(dto.getSku())
                .priceAdjustment(dto.getPriceAdjustment())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .active(true)
                .build();

        ProductVariant saved = variantRepository.save(variant);
        return variantMapper.toDTO(saved);
    }

    @Override
    public ProductVariantDTO getVariantById(UUID variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));
        return variantMapper.toDTO(variant);
    }

    @Override
    public List<ProductVariantDTO> getVariantsByProduct(UUID productId) {
        // Verify product exists
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        List<ProductVariant> variants = variantRepository.findByProductIdAndActiveTrue(productId);
        return variantMapper.toDTOList(variants);
    }

    @Override
    public List<ProductVariantDTO> getVariantsByType(UUID productId, String variantType) {
        List<ProductVariant> variants = variantRepository.findByProductIdAndVariantType(productId, variantType);
        return variantMapper.toDTOList(variants);
    }

    @Override
    public ProductVariantDTO getByProductAndTypeValue(UUID productId, String type, String value) {
        ProductVariant variant = variantRepository
                .findByProductIdAndVariantTypeAndVariantValue(productId, type, value)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", 
                        String.format("type=%s, value=%s", type, value)));
        return variantMapper.toDTO(variant);
    }

    @Override
    @Transactional
    public ProductVariantDTO updateVariant(UUID variantId, ProductVariantDTO dto) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));

        // Check if SKU changed and new SKU already exists
        if (!variant.getSku().equals(dto.getSku()) && 
            variantRepository.findBySku(dto.getSku()).isPresent()) {
            throw new IllegalArgumentException("SKU '" + dto.getSku() + "' đã tồn tại");
        }

        variant.setVariantType(dto.getVariantType());
        variant.setVariantValue(dto.getVariantValue());
        variant.setSku(dto.getSku());
        variant.setPriceAdjustment(dto.getPriceAdjustment());
        variant.setDescription(dto.getDescription());
        variant.setImageUrl(dto.getImageUrl());
        variant.setActive(dto.getActive());

        ProductVariant updated = variantRepository.save(variant);
        return variantMapper.toDTO(updated);
    }

    @Override
    @Transactional
    public void deleteVariant(UUID variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));
        variant.softDelete();
        variantRepository.save(variant);
    }

    @Override
    @Transactional
    public void restoreVariant(UUID variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));
        variant.restore();
        variantRepository.save(variant);
    }

    @Override
    public long countVariants(UUID productId) {
        return variantRepository.countByProductIdAndActiveTrueAndDeletedAtIsNull(productId);
    }

    @Override
    public boolean skuExists(String sku) {
        return variantRepository.findBySku(sku).isPresent();
    }

    @Override
    public List<String> getUniqueVariantTypes(UUID productId) {
        List<ProductVariant> variants = variantRepository.findByProductId(productId);
        return variants.stream()
                .map(ProductVariant::getVariantType)
                .distinct()
                .collect(Collectors.toList());
    }
}
