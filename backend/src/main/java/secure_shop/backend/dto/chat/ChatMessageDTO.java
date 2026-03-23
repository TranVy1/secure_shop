package secure_shop.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import secure_shop.backend.enums.ChatSenderType;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private UUID id;
    private UUID sessionId;
    private ChatSenderType senderType;
    private UUID senderId;
    private String content;
    private String suggestions; // JSON string Quick Replies (Bot gửi)
    private Boolean isRead;
    private LocalDateTime createdAt;
}
