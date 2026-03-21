import { api } from './axiosConfig';

export interface UploadResult {
  url: string;
  path: string;
}

class ImageUploadService {
  async uploadImage(file: File): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to backend using authenticated API
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        url: `http://localhost:8090${response.data.url}`, // Full URL for display
        path: response.data.path,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Upload failed';
      throw new Error(errorMessage);
    }
  }

  async uploadMultipleImages(files: File[]): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }

  async deleteImage(pathOrUrl: string): Promise<void> {
    try {
      const path = this.getPathFromUrl(pathOrUrl);
      await api.delete('/upload/image', {
        params: { path },
      });
    } catch (error: any) {
      console.error('Delete failed:', error);
    }
  }

  async deleteMultipleImages(pathsOrUrls: string[]): Promise<void> {
    const deletePromises = pathsOrUrls.map((path) => this.deleteImage(path));
    await Promise.all(deletePromises);
  }

  private validateFile(file: File): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }
  }

  getPathFromUrl(urlOrPath: string): string {
    if (!urlOrPath.startsWith('http')) return urlOrPath;
    try {
      const url = new URL(urlOrPath);
      const parts = url.pathname.split('/uploads/');
      return parts.length > 1 ? parts[1] : '';
    } catch {
      return '';
    }
  }
}

export const imageUploadService = new ImageUploadService();
