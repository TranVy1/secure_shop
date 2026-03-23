package secure_shop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.ChatMessage;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    
    // Lấy tin nhắn theo session
    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
    
    // Đánh dấu đã đọc
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.isRead = true WHERE cm.session.id = :sessionId AND cm.senderType != :senderType AND cm.isRead = false")
    int markMessagesAsRead(UUID sessionId, secure_shop.backend.enums.ChatSenderType senderType);
}
