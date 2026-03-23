package secure_shop.backend.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.ReturnRequest;
import secure_shop.backend.enums.ReturnStatus;

import java.util.UUID;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, UUID> {
    Page<ReturnRequest> findByUserId(UUID userId, Pageable pageable);
    Page<ReturnRequest> findByStatus(ReturnStatus status, Pageable pageable);
}
