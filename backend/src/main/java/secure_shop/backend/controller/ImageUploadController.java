package secure_shop.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import secure_shop.backend.service.CloudinaryService;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for handling image uploads to Cloudinary
 */
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class ImageUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "File không được để trống"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Chỉ chấp nhận file ảnh"));
            }

            // Validate file size (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Kích thước file không được vượt quá 5MB"));
            }

            log.info("Starting upload for file: {}", file.getOriginalFilename());
            
            // Upload to Cloudinary
            String imageUrl = cloudinaryService.uploadImage(file);

            Map<String, String> response = new HashMap<>();
            response.put("url", imageUrl);
            response.put("path", imageUrl); // For backwards compatibility if any frontend uses 'path'
            response.put("message", "Upload thành công");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi khi upload file lên Cloud: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error during upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @DeleteMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteImage(@RequestParam String path) {
        if (path == null || path.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Đường dẫn ảnh không hợp lệ"));
        }
        try {
            log.info("Deleting image with URL/path: {}", path);
            
            // If the path is a full URL, extract the public ID
            String publicId = cloudinaryService.extractPublicId(path);
            
            boolean deleted = cloudinaryService.deleteImage(publicId);
            
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Xóa thành công"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể xóa ảnh trên Cloudinary"));
            }
        } catch (IOException e) {
            log.error("Cloudinary delete failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi khi xóa file: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during delete", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
}
