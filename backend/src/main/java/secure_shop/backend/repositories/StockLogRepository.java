package secure_shop.backend.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import secure_shop.backend.entities.StockLog;
import secure_shop.backend.enums.StockLogType;

import java.util.List;
import java.util.UUID;

public interface StockLogRepository extends JpaRepository<StockLog, Long> {

    Page<StockLog> findByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);

    List<StockLog> findByReferenceId(String referenceId);

    List<StockLog> findByTypeOrderByCreatedAtDesc(StockLogType type);
}
