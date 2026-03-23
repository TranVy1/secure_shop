package secure_shop.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import secure_shop.backend.entities.ReturnRequest;
import secure_shop.backend.enums.ReturnStatus;

import java.util.UUID;

public interface ReturnRequestService {
    ReturnRequest createReturnRequest(UUID userId, UUID orderId, String reason);
    ReturnRequest updateReturnStatus(UUID requestId, ReturnStatus newStatus, String adminNote);
    Page<ReturnRequest> getMyReturnRequests(UUID userId, Pageable pageable);
    Page<ReturnRequest> getAllReturnRequests(ReturnStatus status, Pageable pageable);
}
