package secure_shop.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import secure_shop.backend.dto.chat.AdminChatMessagePayload;
import secure_shop.backend.dto.chat.ChatMessageDTO;
import secure_shop.backend.dto.chat.ChatMessagePayload;
import secure_shop.backend.dto.chat.ChatSessionDTO;
import secure_shop.backend.entities.ChatMessage;
import secure_shop.backend.entities.ChatSession;
import secure_shop.backend.entities.User;
import secure_shop.backend.enums.ChatSenderType;
import secure_shop.backend.repository.ChatMessageRepository;
import secure_shop.backend.repository.ChatSessionRepository;
import secure_shop.backend.repository.UserRepository;
import secure_shop.backend.service.LiveChatService;
import secure_shop.backend.service.GeminiRestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveChatServiceImpl implements LiveChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeminiRestClient geminiClient;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public ChatSessionDTO getOrCreateSession(UUID userId) {
        Optional<ChatSession> activeSession = sessionRepository.findFirstByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);
        if (activeSession.isPresent()) {
            return mapToSessionDTO(activeSession.get());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatSession newSession = ChatSession.builder()
                .user(user)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        SystemMessage("Hệ thống", "Chào bạn, bạn cần hỗ trợ gì ạ?", newSession);

        return mapToSessionDTO(sessionRepository.save(newSession));
    }

    @Override
    @Transactional
    public ChatMessageDTO saveUserMessage(UUID userId, ChatMessagePayload payload) {
        ChatSession session = sessionRepository.findFirstByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new RuntimeException("No active session found"));

        ChatMessage message = ChatMessage.builder()
                .session(session)
                .senderType(ChatSenderType.USER)
                .senderId(userId)
                .content(payload.getContent())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        message = messageRepository.save(message);
        
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);
        
        return mapToMessageDTO(message);
    }

    @Override
    @Transactional
    public void handleBotAutoReply(UUID sessionId, String userMessage) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getAdmin() != null) {
            return; // Đang có Admin chat, Bot không chen vào
        }

        String lowerMsg = userMessage.toLowerCase();
        if (lowerMsg.contains("tư vấn viên") || lowerMsg.contains("gặp người") || lowerMsg.contains("admin")) {
            SystemMessage("Bot", "Hệ thống đang kết nối bạn với nhân viên hỗ trợ...", session);
            messagingTemplate.convertAndSend("/topic/admin.chat-sessions", 
                "{\"type\": \"ALERT\", \"message\": \"User đang yêu cầu hỗ trợ trực tiếp!\", \"sessionId\": \"" + sessionId + "\"}");
            return;
        }

        String aiResponse = "Tôi có thể giúp gì cho bạn? Nếu cần hỗ trợ phức tạp, hãy gõ 'Gặp tư vấn viên'.";
        if (geminiClient.isAvailable()) {
            String context = "Bạn là trợ lý bán hàng tự động cho SecureShop. Trả lời cực kỳ ngắn gọn, tiếng Việt. Mời gọi khách mua camera.";
            aiResponse = geminiClient.generate(context, userMessage);
        }

        SystemMessage("Bot", aiResponse, session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatSessionDTO> getActiveSessionsForAdmin() {
        return sessionRepository.findAllActiveSessions().stream()
                .map(this::mapToSessionDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatSessionDTO assignAdminToSession(UUID sessionId, UUID adminId) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        session.setAdmin(admin);
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);

        SystemMessage("Hệ thống", "Nhân viên " + admin.getName() + " đã tham gia cuộc trò chuyện.", session);

        return mapToSessionDTO(session);
    }

    @Override
    @Transactional
    public void closeSession(UUID sessionId, UUID adminId) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setIsActive(false);
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);

        SystemMessage("Hệ thống", "Phiên hỗ trợ đã được đóng bởi nhân viên.", session);
    }

    @Override
    @Transactional
    public ChatMessageDTO saveAdminMessage(UUID adminId, AdminChatMessagePayload payload) {
        ChatSession session = sessionRepository.findById(payload.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        ChatMessage message = ChatMessage.builder()
                .session(session)
                .senderType(ChatSenderType.ADMIN)
                .senderId(adminId)
                .content(payload.getContent())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        message = messageRepository.save(message);
        
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);

        return mapToMessageDTO(message);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getSessionHistory(UUID sessionId) {
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(this::mapToMessageDTO)
                .collect(Collectors.toList());
    }

    private void SystemMessage(String type, String content, ChatSession session) {
        ChatMessage msg = ChatMessage.builder()
                .session(session)
                .senderType(type.equals("Bot") ? ChatSenderType.BOT : ChatSenderType.SYSTEM)
                .content(content)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(msg);
        
        messagingTemplate.convertAndSendToUser(
                session.getUser().getId().toString(),
                "/queue/chat",
                mapToMessageDTO(msg)
        );
    }

    private ChatSessionDTO mapToSessionDTO(ChatSession session) {
        return ChatSessionDTO.builder()
                .id(session.getId())
                .userId(session.getUser().getId())
                .userName(session.getUser().getName())
                .userAvatar(session.getUser().getAvatarUrl())
                .adminId(session.getAdmin() != null ? session.getAdmin().getId() : null)
                .adminName(session.getAdmin() != null ? session.getAdmin().getName() : null)
                .isActive(session.getIsActive())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    private ChatMessageDTO mapToMessageDTO(ChatMessage message) {
        return ChatMessageDTO.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .senderType(message.getSenderType())
                .senderId(message.getSenderId())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
