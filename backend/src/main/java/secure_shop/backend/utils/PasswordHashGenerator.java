package secure_shop.backend.utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility để generate BCrypt password hash
 * Chạy class này để tạo hash cho password mới
 */
public class PasswordHashGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // Generate hash cho các password phổ biến
        String[] passwords = { "admin123", "password123", "test123" };

        System.out.println("=".repeat(80));
        System.out.println("BCRYPT PASSWORD HASH GENERATOR");
        System.out.println("=".repeat(80));

        for (String password : passwords) {
            String hash = encoder.encode(password);
            System.out.println("\nPassword: " + password);
            System.out.println("Hash:     " + hash);

            // Verify hash
            boolean matches = encoder.matches(password, hash);
            System.out.println("Verified: " + (matches ? "✓" : "✗"));
        }

        System.out.println("\n" + "=".repeat(80));
        System.out.println("Copy hash vào SQL UPDATE statement:");
        System.out.println("=".repeat(80));

        String adminHash = encoder.encode("admin123");
        System.out.println("\nUPDATE users");
        System.out.println("SET password_hash = '" + adminHash + "'");
        System.out.println("WHERE email = 'admin2@secureshop.vn';");

        System.out.println("\n" + "=".repeat(80));
    }
}
