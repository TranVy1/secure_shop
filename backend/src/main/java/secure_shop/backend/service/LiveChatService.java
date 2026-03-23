package secure_shop.backend.service;

import secure_shop.backend.dto.chat.AdminChatMessagePayload;
import secure_shop.backend.dto.chat.ChatMessageDTO;
import secure_shop.backend.dto.chat.ChatMessagePayload;
import secure_shop.backend.dto.chat.ChatSessionDTO;

import java.util.List;
import java.util.UUID;

public interface LiveChatService {
    
    // User
    ChatSessionDTO getOrCreateSession(UUID userId);
    ChatMessageDTO saveUserMessage(UUID userId, ChatMessagePayload payload);
    void handleBotAutoReply(UUID sessionId, String userMessage);
    
    // Admin
    List<ChatSessionDTO> getActiveSessionsForAdmin();
    ChatSessionDTO assignAdminToSession(UUID sessionId, UUID adminId);
    void closeSession(UUID sessionId, UUID adminId);
    ChatMessageDTO saveAdminMessage(UUID adminId, AdminChatMessagePayload payload);
    
    // Common
    List<ChatMessageDTO> getSessionHistory(UUID sessionId);
    UUID getUserIdBySessionId(UUID sessionId);
}
