package secure_shop.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import secure_shop.backend.dto.chat.AdminChatMessagePayload;
import secure_shop.backend.dto.chat.ChatMessageDTO;
import secure_shop.backend.dto.chat.ChatMessagePayload;
import secure_shop.backend.service.LiveChatService;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class LiveChatSTOMPController {

    private final LiveChatService liveChatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * User nhắn tin (tới Bot hoặc Admin)
     */
    @MessageMapping("/chat.user.send")
    public void handleUserMessage(@Payload ChatMessagePayload payload, Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        if (principal == null) return;
        UUID userId = UUID.fromString(principal.getName());
        
        log.info("User {} gửi tin nhắn chat: {}", userId, payload.getContent());

        // Lưu tin nhắn vào DB
        ChatMessageDTO savedMsg = liveChatService.saveUserMessage(userId, payload);

        // Phát tín hiệu cho User thấy tin nhắn chính mình vừa gửi đã lưu DB
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/chat", savedMsg);

        // Fetch session update (Dù là Admin hay Bot đang giữ)
        var session = liveChatService.getOrCreateSession(userId);

        if (session.getAdminId() != null) {
            // Có Admin -> Gửi về kênh của Admin đó
            messagingTemplate.convertAndSendToUser(session.getAdminId().toString(), "/queue/admin.chat", savedMsg);
        } else {
            // Không có Admin -> AI Bot tự trả lời
            liveChatService.handleBotAutoReply(session.getId(), payload.getContent());
        }
    }

    /**
     * Admin phản hồi tới User cụ thể
     */
    @MessageMapping("/chat.admin.send")
    public void handleAdminMessage(@Payload AdminChatMessagePayload payload, Principal principal) {
        if (principal == null) return;
        UUID adminId = UUID.fromString(principal.getName());
        
        log.info("Admin {} phản hồi tới session {}: {}", adminId, payload.getSessionId(), payload.getContent());

        // Lưu tin nhắn admin vào DB
        ChatMessageDTO savedMsg = liveChatService.saveAdminMessage(adminId, payload);

        // Lấy userId từ sessionId để route tin nhắn
        UUID destUserId = liveChatService.getUserIdBySessionId(payload.getSessionId());

        // Gửi tới User
        messagingTemplate.convertAndSendToUser(destUserId.toString(), "/queue/chat", savedMsg);

        // Gửi lại cho Admin (confirm)
        messagingTemplate.convertAndSendToUser(adminId.toString(), "/queue/admin.chat", savedMsg);
    }
}
