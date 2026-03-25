package secure_shop.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface CloudinaryService {
    
    /**
     * Upload an image to Cloudinary
     * 
     * @param file the multipart file to upload
     * @return the secure URL of the uploaded image
     * @throws IOException if there's an error reading the file
     */
    String uploadImage(MultipartFile file) throws IOException;
    
    /**
     * Delete an image from Cloudinary
     * 
     * @param publicId the public ID of the image on Cloudinary (usually extracted from URL)
     * @return true if deleted successfully, false otherwise
     * @throws IOException if there's an error communicating with Cloudinary
     */
    boolean deleteImage(String publicId) throws IOException;
    
    /**
     * Extract public ID from a full Cloudinary URL
     * 
     * @param url the full URL (e.g. https://res.cloudinary.com/cloudName/image/upload/v1234/folder/file.jpg)
     * @return the public ID (e.g. folder/file)
     */
    String extractPublicId(String url);
}
