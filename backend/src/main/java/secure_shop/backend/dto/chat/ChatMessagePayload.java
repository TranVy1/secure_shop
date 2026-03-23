package secure_shop.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessagePayload {
    private String content;
    private String action; // Ví dụ: VIEW_ORDERS (Dành cho Quick Replies)
    private UUID sessionId; // Thường client không cần gửi, server tự map nếu là User
}
