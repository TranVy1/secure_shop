import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { productColorApi } from '../../utils/api';
import { imageUploadService } from '../../utils/imageUploadService';
import type { ProductColor } from '../../types/types';

interface ProductColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  color?: ProductColor;
  onSuccess: () => void;
}

const ProductColorModal: React.FC<ProductColorModalProps> = ({
  isOpen,
  onClose,
  productId,
  color,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    colorName: '',
    hexCode: '#000000',
    description: '',
    active: true,
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!color;

  useEffect(() => {
    if (color && isOpen) {
      setFormData({
        colorName: color.colorName || '',
        hexCode: color.hexCode || '#000000',
        description: color.description || '',
        active: color.active ?? true,
        imageUrl: color.imageUrl || '',
      });
      setImagePreview(color.imageUrl || null);
    } else {
      resetForm();
    }
  }, [color, isOpen]);

  const resetForm = () => {
    setFormData({
      colorName: '',
      hexCode: '#000000',
      description: '',
      active: true,
      imageUrl: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.colorName?.trim()) newErrors.colorName = 'Tên màu bắt buộc';
    if (!formData.hexCode?.trim()) newErrors.hexCode = 'Mã hex bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        try {
          const uploadResult = await imageUploadService.uploadImage(imageFile);
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          toast.error('Lỗi tải ảnh lên');
          setIsLoading(false);
          return;
        }
      }

      const payload = {
        colorName: formData.colorName,
        hexCode: formData.hexCode,
        description: formData.description || undefined,
        active: formData.active,
        imageUrl: imageUrl || undefined,
      };

      if (isEditing && color) {
        await productColorApi.update(color.id, payload);
        toast.success('Cập nhật màu sắc thành công!');
      } else {
        await productColorApi.create(productId, payload);
        toast.success('Thêm màu sắc thành công!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving color:', error);
      toast.error(error?.response?.data?.message || 'Lỗi khi lưu màu sắc');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Cập nhật Màu sắc' : 'Thêm Màu sắc'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Color Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên màu *
            </label>
            <input
              type="text"
              value={formData.colorName}
              onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
              placeholder="VD: Black, White, Silver..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.colorName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.colorName && <p className="text-red-500 text-xs mt-1">{errors.colorName}</p>}
          </div>

          {/* Hex Code */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã Hex *
              </label>
              <input
                type="text"
                value={formData.hexCode}
                onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                placeholder="#000000"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.hexCode ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hexCode && <p className="text-red-500 text-xs mt-1">{errors.hexCode}</p>}
            </div>
            <div className="flex items-end">
              <div
                className="w-12 h-10 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: formData.hexCode || '#000000' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả về màu sắc..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Kích hoạt
            </label>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh mẫu màu
            </label>
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Color preview"
                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById(`color-image-input`)?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 hover:bg-purple-50 transition"
              >
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Chọn ảnh</p>
              </button>
            )}
            <input
              id="color-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductColorModal;
