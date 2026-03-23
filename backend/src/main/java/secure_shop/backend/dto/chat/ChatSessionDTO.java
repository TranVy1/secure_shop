package secure_shop.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionDTO {
    private UUID id;
    private UUID userId;
    private String userName; // Tên user
    private String userAvatar; // Lấy thêm cho UI
    
    private UUID adminId;
    private String adminName;
    
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private List<ChatMessageDTO> messages;
}
