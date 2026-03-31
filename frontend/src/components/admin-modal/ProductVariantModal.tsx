import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { productVariantApi } from '../../utils/api';
import { imageUploadService } from '../../utils/imageUploadService';
import type { ProductVariant } from '../../types/types';

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  variant?: ProductVariant;
  onSuccess: () => void;
}

const ProductVariantModal: React.FC<ProductVariantModalProps> = ({
  isOpen,
  onClose,
  productId,
  variant,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    variantType: '',
    variantValue: '',
    sku: '',
    priceAdjustment: 0,
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!variant;

  useEffect(() => {
    if (variant && isOpen) {
      setFormData({
        variantType: variant.variantType || '',
        variantValue: variant.variantValue || '',
        sku: variant.sku || '',
        priceAdjustment: variant.priceAdjustment || 0,
        imageUrl: variant.imageUrl || '',
      });
      setImagePreview(variant.imageUrl || null);
    } else {
      resetForm();
    }
  }, [variant, isOpen]);

  const resetForm = () => {
    setFormData({
      variantType: '',
      variantValue: '',
      sku: '',
      priceAdjustment: 0,
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

    if (!formData.variantType?.trim()) newErrors.variantType = 'Loại biến thể bắt buộc';
    if (!formData.variantValue?.trim()) newErrors.variantValue = 'Giá trị biến thể bắt buộc';
    if (!formData.sku?.trim()) newErrors.sku = 'SKU bắt buộc';
    if (formData.priceAdjustment === undefined || formData.priceAdjustment === null) {
      newErrors.priceAdjustment = 'Giá điều chỉnh bắt buộc';
    }

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
        variantType: formData.variantType,
        variantValue: formData.variantValue,
        sku: formData.sku,
        priceAdjustment: formData.priceAdjustment,
        imageUrl: imageUrl || undefined,
      };

      if (isEditing && variant) {
        await productVariantApi.update(variant.id, payload);
        toast.success('Cập nhật biến thể thành công!');
      } else {
        await productVariantApi.create(productId, payload);
        toast.success('Thêm biến thể thành công!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving variant:', error);
      toast.error(error?.response?.data?.message || 'Lỗi khi lưu biến thể');
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
            {isEditing ? 'Cập nhật Biến thể' : 'Thêm Biến thể'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Variant Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại biến thể *
            </label>
            <input
              type="text"
              value={formData.variantType}
              onChange={(e) => setFormData({ ...formData, variantType: e.target.value })}
              placeholder="VD: resolution, lens_type, memory..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.variantType ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.variantType && <p className="text-red-500 text-xs mt-1">{errors.variantType}</p>}
          </div>

          {/* Variant Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá trị biến thể *
            </label>
            <input
              type="text"
              value={formData.variantValue}
              onChange={(e) => setFormData({ ...formData, variantValue: e.target.value })}
              placeholder="VD: 4MP, 50m, Black, 8GB..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.variantValue ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.variantValue && <p className="text-red-500 text-xs mt-1">{errors.variantValue}</p>}
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="VD: SKU-001"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.sku ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
          </div>

          {/* Price Adjustment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá điều chỉnh (VND) *
            </label>
            <input
              type="number"
              value={formData.priceAdjustment}
              onChange={(e) => setFormData({ ...formData, priceAdjustment: parseFloat(e.target.value) })}
              placeholder="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.priceAdjustment ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.priceAdjustment && <p className="text-red-500 text-xs mt-1">{errors.priceAdjustment}</p>}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh biến thể
            </label>
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Variant preview"
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
                onClick={() => document.getElementById(`variant-image-input`)?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 hover:bg-purple-50 transition"
              >
                <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Chọn ảnh</p>
              </button>
            )}
            <input
              id="variant-image-input"
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

export default ProductVariantModal;
