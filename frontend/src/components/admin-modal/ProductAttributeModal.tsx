import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { productAttributeApi } from '../../utils/api';
import type { ProductAttribute } from '../../types/types';

interface ProductAttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  attribute?: ProductAttribute;
  variantId?: string;
  onSuccess: () => void;
}

const ProductAttributeModal: React.FC<ProductAttributeModalProps> = ({
  isOpen,
  onClose,
  productId,
  attribute,
  variantId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    attributeKey: '',
    attributeName: '',
    attributeValue: '',
    valueType: 'string',
    unit: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!attribute;

  const valueTypes = [
    { value: 'string', label: 'Văn bản' },
    { value: 'number', label: 'Số' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'select', label: 'Lựa chọn' },
  ];

  useEffect(() => {
    if (attribute && isOpen) {
      setFormData({
        attributeKey: attribute.attributeKey || '',
        attributeName: attribute.attributeName || '',
        attributeValue: attribute.attributeValue || '',
        valueType: attribute.valueType || 'string',
        unit: attribute.unit || '',
      });
    } else {
      resetForm();
    }
  }, [attribute, isOpen]);

  const resetForm = () => {
    setFormData({
      attributeKey: '',
      attributeName: '',
      attributeValue: '',
      valueType: 'string',
      unit: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.attributeKey?.trim()) newErrors.attributeKey = 'Khóa thuộc tính bắt buộc';
    if (!formData.attributeName?.trim()) newErrors.attributeName = 'Tên thuộc tính bắt buộc';
    if (!formData.attributeValue?.trim()) newErrors.attributeValue = 'Giá trị thuộc tính bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        attributeKey: formData.attributeKey,
        attributeName: formData.attributeName,
        attributeValue: formData.attributeValue,
        valueType: formData.valueType,
        unit: formData.unit || undefined,
        variantId: variantId || undefined,
      };

      if (isEditing && attribute) {
        await productAttributeApi.update(attribute.id, payload);
        toast.success('Cập nhật thuộc tính thành công!');
      } else {
        await productAttributeApi.create(productId, payload);
        toast.success('Thêm thuộc tính thành công!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving attribute:', error);
      toast.error(error?.response?.data?.message || 'Lỗi khi lưu thuộc tính');
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
            {isEditing ? 'Cập nhật Thuộc tính' : 'Thêm Thuộc tính'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Attribute Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khóa thuộc tính *
            </label>
            <input
              type="text"
              value={formData.attributeKey}
              onChange={(e) => setFormData({ ...formData, attributeKey: e.target.value })}
              placeholder="VD: resolution, ir_range, storage..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.attributeKey ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.attributeKey && <p className="text-red-500 text-xs mt-1">{errors.attributeKey}</p>}
          </div>

          {/* Attribute Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên thuộc tính *
            </label>
            <input
              type="text"
              value={formData.attributeName}
              onChange={(e) => setFormData({ ...formData, attributeName: e.target.value })}
              placeholder="VD: Độ phân giải, Tầm hồng ngoại, Dung lượng..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.attributeName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.attributeName && <p className="text-red-500 text-xs mt-1">{errors.attributeName}</p>}
          </div>

          {/* Attribute Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá trị thuộc tính *
            </label>
            <input
              type="text"
              value={formData.attributeValue}
              onChange={(e) => setFormData({ ...formData, attributeValue: e.target.value })}
              placeholder="VD: 4MP, 50m, 8GB..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.attributeValue ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.attributeValue && <p className="text-red-500 text-xs mt-1">{errors.attributeValue}</p>}
          </div>

          {/* Value Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại giá trị
            </label>
            <select
              value={formData.valueType}
              onChange={(e) => setFormData({ ...formData, valueType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {valueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị (tùy chọn)
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="VD: MP, m, GB..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

export default ProductAttributeModal;
