package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
//import org.springframework.ai.document.Document;
//import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import secure_shop.backend.entities.Product;
import secure_shop.backend.repositories.ProductRepository;
import secure_shop.backend.service.VectorIngestionService;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VectorIngestionServiceImpl implements VectorIngestionService {

    // private final VectorStore vectorStore;
    private final ProductRepository productRepository;

    @Override
    public void ingestPoliciesAndTopProducts() {
        // vectorStore.add(docs);
        log.info("Vector ingestion disabled due to migration to SQL Server");
    }

    private String buildProductText(Product p) {
        return String.format("Sản phẩm %s (SKU %s) giá %s, đánh giá %.1f với %d lượt đánh giá. Mô tả ngắn: %s",
                p.getName(), p.getSku(), p.getPrice(), p.getRating(), p.getReviewCount(),
                Optional.ofNullable(p.getShortDesc()).orElse("(không có)"));
    }
}
