package secure_shop.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import secure_shop.backend.entities.Notification;
import java.util.UUID;

public interface NotificationService {
    Notification sendNotification(UUID userId, String title, String message);
    Page<Notification> getUserNotifications(UUID userId, Pageable pageable);
    void markAllAsRead(UUID userId);
}
