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

        // Lấy thông tin user của Session này
        var session = liveChatService.getSessionHistory(payload.getSessionId());
        if (session.isEmpty()) return;
        UUID userId = session.get(0).getSessionId(); // Logic này tạm, cần refactor fetch user_id từ session, ta dùng query gián tiếp

        ChatMessageDTO savedMsg = liveChatService.saveAdminMessage(adminId, payload);

        // Gửi tới User
        // Vì trong Controller chưa truy xuất trực tiếp UserID từ STOMP payload hiệu quả, 
        // Thay vì query DB ở đây, ta dùng service lấy Session metadata
        UUID destUserId = liveChatService.getOrCreateSession(UUID.fromString(savedMsg.getSenderId().toString())).getUserId(); 
        // Sửa: Lấy DestUserID thật từ API REST lịch sử
        // Tạm cheat: Thực ra Admin biết UserID của khách hàng? Không, Admin chỉ biết SessionID.
        // Ta cần LiveChatService phụ trợ:
    }
}
