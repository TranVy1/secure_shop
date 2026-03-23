package secure_shop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.ChatSession;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    
    // Tìm session theo user hiện tại đang active
    Optional<ChatSession> findFirstByUserIdAndIsActiveTrueOrderByCreatedAtDesc(UUID userId);
    
    // Lấy toàn bộ sessions đang active cho Admin Dashboard
    @Query("SELECT cs FROM ChatSession cs JOIN FETCH cs.user WHERE cs.isActive = true ORDER BY cs.updatedAt DESC")
    List<ChatSession> findAllActiveSessions();
    
    // Lấy danh sách session của một admin
    List<ChatSession> findByAdminIdOrderByUpdatedAtDesc(UUID adminId);
    
    // Đếm số session active (để limit spam)
    long countByUserIdAndIsActiveTrue(UUID userId);
}
