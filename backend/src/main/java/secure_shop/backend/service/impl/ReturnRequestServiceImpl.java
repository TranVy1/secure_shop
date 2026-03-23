package secure_shop.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.entities.Order;
import secure_shop.backend.entities.ReturnRequest;
import secure_shop.backend.entities.User;
import secure_shop.backend.enums.OrderStatus;
import secure_shop.backend.enums.ReturnStatus;
import secure_shop.backend.exception.BusinessRuleViolationException;
import secure_shop.backend.exception.ResourceNotFoundException;
import secure_shop.backend.repositories.OrderRepository;
import secure_shop.backend.repositories.ReturnRequestRepository;
import secure_shop.backend.repositories.UserRepository;
import secure_shop.backend.service.ReturnRequestService;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReturnRequestServiceImpl implements ReturnRequestService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    public ReturnRequest createReturnRequest(UUID userId, UUID orderId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new BusinessRuleViolationException("Bạn không phải chủ đơn hàng này");
        }
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessRuleViolationException("Chỉ đơn hàng đã giao mới có thể yêu cầu đổi trả");
        }

        ReturnRequest request = ReturnRequest.builder()
                .user(user)
                .order(order)
                .reason(reason)
                .status(ReturnStatus.PENDING)
                .build();
        return returnRequestRepository.save(request);
    }

    @Override
    public ReturnRequest updateReturnStatus(UUID requestId, ReturnStatus newStatus, String adminNote) {
        ReturnRequest request = returnRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ReturnRequest", requestId));

        request.setStatus(newStatus);
        if (adminNote != null) {
            request.setAdminNote(adminNote);
        }
        // Could integrate with PaymentService for refunds here if REFUNDED
        return returnRequestRepository.save(request);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReturnRequest> getMyReturnRequests(UUID userId, Pageable pageable) {
        return returnRequestRepository.findByUserId(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReturnRequest> getAllReturnRequests(ReturnStatus status, Pageable pageable) {
        if (status != null) {
            return returnRequestRepository.findByStatus(status, pageable);
        }
        return returnRequestRepository.findAll(pageable);
    }
}
