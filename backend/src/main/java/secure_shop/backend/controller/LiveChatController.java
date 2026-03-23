package secure_shop.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.config.security.CustomUserDetails;
import secure_shop.backend.dto.chat.ChatMessageDTO;
import secure_shop.backend.dto.chat.ChatSessionDTO;
import secure_shop.backend.service.LiveChatService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/live-chat")
@RequiredArgsConstructor
public class LiveChatController {

    private final LiveChatService liveChatService;

    // --- USER ENDPOINTS ---

    @GetMapping("/session/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ChatSessionDTO> getMySession(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(liveChatService.getOrCreateSession(userDetails.getId()));
    }

    @GetMapping("/session/{sessionId}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatMessageDTO>> getSessionHistory(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(liveChatService.getSessionHistory(sessionId));
    }


    // --- ADMIN ENDPOINTS ---

    @GetMapping("/admin/sessions/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ChatSessionDTO>> getActiveSessions() {
        return ResponseEntity.ok(liveChatService.getActiveSessionsForAdmin());
    }

    @PostMapping("/admin/sessions/{sessionId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ChatSessionDTO> assignToMe(
            @PathVariable UUID sessionId, 
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        return ResponseEntity.ok(liveChatService.assignAdminToSession(sessionId, userDetails.getId()));
    }

    @PostMapping("/admin/sessions/{sessionId}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> closeSession(
            @PathVariable UUID sessionId, 
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        liveChatService.closeSession(sessionId, userDetails.getId());
        return ResponseEntity.ok().build();
    }
}
