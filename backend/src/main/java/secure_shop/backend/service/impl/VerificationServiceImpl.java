package secure_shop.backend.service.impl;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import secure_shop.backend.entities.User;
import secure_shop.backend.exception.ConflictException;
import secure_shop.backend.repositories.UserRepository;
import secure_shop.backend.service.EmailService;
import secure_shop.backend.service.VerificationService;
import secure_shop.backend.utils.HashUtil;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class VerificationServiceImpl implements VerificationService {

    private final EmailService emailService;
    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    public void sendVerificationEmail(String email, String userId) {
        String rawToken = UUID.randomUUID().toString();
        String hashedToken = HashUtil.sha256(rawToken);

        // Lưu token -> userId
        redisTemplate.opsForValue().set(
            "verify_token:" + hashedToken, 
            userId, 
            24, 
            TimeUnit.HOURS
        );
        
        // Lưu email -> token để resend
        redisTemplate.opsForValue().set(
            "verify_email:" + email, 
            rawToken, 
            24, 
            TimeUnit.HOURS
        );

        String verificationLink = frontendUrl + "/verify-email?token=" + rawToken;
        sendVerificationMailAsync(email, verificationLink);
    }

    @Async
    public void sendVerificationMailAsync(String email, String link) {
        try {
            emailService.sendVerificationEmail(email, link);
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Lỗi gửi email xác thực: " + e.getMessage());
        }
    }

    @Override
    public boolean verifyEmail(String rawToken) {
        System.out.println("🔍 [VERIFY] Starting verification for token: " + rawToken.substring(0, 8) + "...");

        String hashedToken = HashUtil.sha256(rawToken);
        String userId = redisTemplate.opsForValue().get("verify_token:" + hashedToken);

        if (userId == null) {
            System.out.println("❌ [VERIFY] Token not found in Redis - already used or expired");

            // ✅ Kiểm tra xem user đã enabled chưa
            // Nếu đã enabled thì coi như đã verify thành công rồi
            // (Tránh lỗi khi user click link 2 lần)

            return false; // Hoặc throw exception với message rõ ràng hơn
        }

        UUID userUuid;
        try {
            userUuid = UUID.fromString(userId);
        } catch (IllegalArgumentException e) {
            System.out.println("❌ [VERIFY] Invalid UUID format: " + userId);
            return false;
        }

        User user = userRepository.findById(userUuid).orElse(null);

        if (user == null) {
            System.out.println("❌ [VERIFY] User not found with ID: " + userUuid);
            return false;
        }

        // ✅ Kiểm tra xem user đã enabled chưa
        if (Boolean.TRUE.equals(user.getEnabled())) {
            System.out.println("⚠️ [VERIFY] User already verified: " + user.getEmail());

            // Xóa token cũ nếu còn
            redisTemplate.delete("verify_token:" + hashedToken);
            redisTemplate.delete("verify_email:" + user.getEmail());

            // Vẫn return true vì user đã được verify rồi
            return true;
        }

        System.out.println("✅ [VERIFY] Activating user: " + user.getEmail());
        user.setEnabled(true);
        userRepository.save(user);

        // Xóa token đã sử dụng
        redisTemplate.delete("verify_token:" + hashedToken);
        redisTemplate.delete("verify_email:" + user.getEmail());

        System.out.println("✅ [VERIFY] Verification completed successfully");
        return true;
    }

    @Override
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        // ✅ FIX 2: Dùng getEnabled() hoặc kiểm tra Boolean.TRUE
        if (Boolean.TRUE.equals(user.getEnabled())) {
            throw new ConflictException("Tài khoản đã được xác thực");
        }

        // Giới hạn số lần gửi
        String countKey = "verify_count:" + email;
        String countStr = redisTemplate.opsForValue().get(countKey);
        int count = countStr == null ? 0 : Integer.parseInt(countStr);

        if (count >= 3) {
            throw new RuntimeException("Bạn đã vượt quá giới hạn gửi lại (3 lần/giờ)");
        }

        redisTemplate.opsForValue().set(countKey, String.valueOf(count + 1), 1, TimeUnit.HOURS);

        // Gửi lại email
        String existingToken = redisTemplate.opsForValue().get("verify_email:" + email);
        
        if (existingToken != null) {
            String link = frontendUrl + "/verify-email?token=" + existingToken;
            sendVerificationMailAsync(email, link);
        } else {
            // ✅ FIX 1: Convert UUID -> String
            sendVerificationEmail(email, user.getId().toString());
        }
    }
}