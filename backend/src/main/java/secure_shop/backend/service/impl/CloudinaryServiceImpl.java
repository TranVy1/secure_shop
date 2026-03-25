package secure_shop.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import secure_shop.backend.service.CloudinaryService;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Override
    public String uploadImage(MultipartFile file) throws IOException {
        log.info("Uploading image to Cloudinary: {}", file.getOriginalFilename());

        // Upload image, return map containing details
        @SuppressWarnings("rawtypes")
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "resource_type", "auto", // Automatically detect file type
                "folder", "secureshop" // Optional: specify a folder
        ));

        // Get the secure HTTPS URL
        String secureUrl = uploadResult.get("secure_url").toString();
        log.info("Image uploaded successfully! URL: {}", secureUrl);

        return secureUrl;
    }

    @Override
    public boolean deleteImage(String publicId) throws IOException {
        if (publicId == null || publicId.trim().isEmpty()) {
            log.warn("Cannot delete image with empty publicId");
            return false;
        }

        log.info("Deleting image from Cloudinary with publicId: {}", publicId);
        @SuppressWarnings("rawtypes")
        Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        String resultStatus = (String) result.get("result");

        boolean isDeleted = "ok".equalsIgnoreCase(resultStatus);

        if (isDeleted) {
            log.info("Image deleted successfully!");
        } else {
            log.warn("Failed to delete image. Cloudinary response: {}", resultStatus);
        }

        return isDeleted;
    }

    @Override
    public String extractPublicId(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }

        try {
            // Cloudinary URLs typically look like:
            // https://res.cloudinary.com/cloudName/image/upload/v12345/folder/file.jpg

            // Removing the domain, version and extension
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex != -1) {
                String afterUpload = url.substring(uploadIndex + 8);

                // Remove version tag if it exists (e.g., v1612.../)
                if (afterUpload.matches("v\\d+/.*")) {
                    int slashIndex = afterUpload.indexOf("/");
                    afterUpload = afterUpload.substring(slashIndex + 1);
                }

                // Remove extension (e.g., .jpg, .png)
                int dotIndex = afterUpload.lastIndexOf(".");
                if (dotIndex != -1) {
                    return afterUpload.substring(0, dotIndex);
                }
                return afterUpload;
            }
        } catch (Exception e) {
            log.warn("Error extracting public ID from URL: {}", url, e);
        }

        // Fallback: return the url itself or a generated ID
        return url;
    }
}
