package secure_shop.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import secure_shop.backend.entities.User;
import secure_shop.backend.repositories.UserRepository;

import java.util.HashMap;
import java.util.Map;

/**
 * DEBUG CONTROLLER - XÓA SAU KHI FIX XONG!!!
 * Controller để test password matching
 */
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/test-password")
    public ResponseEntity<?> testPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        Map<String, Object> result = new HashMap<>();
        result.put("email", email);
        result.put("password_input", password);

        // Tìm user
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            result.put("found", false);
            result.put("message", "❌ User không tồn tại");
            return ResponseEntity.ok(result);
        }

        result.put("found", true);
        result.put("user_id", user.getId());
        result.put("user_name", user.getName());
        result.put("enabled", user.getEnabled());
        result.put("role", user.getRole());
        result.put("provider", user.getProvider());

        // Lấy hash từ DB
        String storedHash = user.getPasswordHash();
        result.put("stored_hash", storedHash);
        result.put("hash_length", storedHash != null ? storedHash.length() : 0);
        result.put("hash_prefix", storedHash != null ? storedHash.substring(0, Math.min(20, storedHash.length())) : "");

        // Test password matching
        boolean matches = passwordEncoder.matches(password, storedHash);
        result.put("password_matches", matches);

        // Generate new hash cho password này
        String newHash = passwordEncoder.encode(password);
        result.put("new_hash_for_this_password", newHash);
        result.put("new_hash_matches", passwordEncoder.matches(password, newHash));

        if (matches) {
            result.put("message", "✅ Password ĐÚNG! Login should work!");
        } else {
            result.put("message", "❌ Password SAI! Hash không khớp.");
            result.put("suggestion",
                    "Chạy SQL: UPDATE users SET password_hash = '" + newHash + "' WHERE email = '" + email + "';");
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User không tồn tại"));
        }

        String newHash = passwordEncoder.encode(newPassword);
        user.setPasswordHash(newHash);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "✅ Password đã được reset",
                "email", email,
                "new_hash", newHash));
    }
}
