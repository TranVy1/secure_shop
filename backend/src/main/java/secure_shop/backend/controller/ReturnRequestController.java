package secure_shop.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.config.security.CustomUserDetails;
import secure_shop.backend.entities.ReturnRequest;
import secure_shop.backend.enums.ReturnStatus;
import secure_shop.backend.service.ReturnRequestService;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnRequestController {

    private final ReturnRequestService returnService;

    @PostMapping
    public ResponseEntity<ReturnRequest> createReturnRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        UUID orderId = UUID.fromString(body.get("orderId"));
        String reason = body.get("reason");
        return ResponseEntity.ok(returnService.createReturnRequest(userDetails.getUser().getId(), orderId, reason));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<ReturnRequest>> getMyReturns(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(returnService.getMyReturnRequests(userDetails.getUser().getId(), pageable));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ReturnRequest>> getAllReturns(
            @RequestParam(required = false) ReturnStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(returnService.getAllReturnRequests(status, pageable));
    }

    @PatchMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReturnRequest> updateReturnStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        ReturnStatus newStatus = ReturnStatus.valueOf(body.get("status").toUpperCase());
        String adminNote = body.get("adminNote");
        return ResponseEntity.ok(returnService.updateReturnStatus(id, newStatus, adminNote));
    }
}
