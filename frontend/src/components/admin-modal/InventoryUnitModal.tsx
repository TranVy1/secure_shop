import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { inventoryUnitApi, productVariantApi, productColorApi } from '../../utils/api';
import type { ProductVariant, ProductColor } from '../../types/types';

interface InventoryUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onSuccess: () => void;
}

const InventoryUnitModal: React.FC<InventoryUnitModalProps> = ({
  isOpen,
  onClose,
  productId,
  onSuccess,
}) => {
  const [importMode, setImportMode] = useState<'bulk' | 'generate'>('bulk');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bulk import form
  const [bulkFormData, setBulkFormData] = useState({
    variantId: '',
    colorId: '',
    imeiList: '',
  });

  // Generate range form
  const [generateFormData, setGenerateFormData] = useState({
    variantId: '',
    prefix: '',
    startSequence: 1,
    quantity: 100,
  });

  useEffect(() => {
    if (isOpen) {
      loadVariantsAndColors();
    }
  }, [isOpen]);

  const loadVariantsAndColors = async () => {
    try {
      const variantsData = await productVariantApi.getByProduct(productId);
      setVariants(variantsData || []);

      const colorsData = await productColorApi.getByProduct(productId);
      setColors(colorsData || []);
    } catch (error) {
      console.error('Error loading variants/colors:', error);
      toast.error('Lỗi tải biến thể và màu sắc');
    }
  };

  const validateBulkForm = () => {
    const newErrors: Record<string, string> = {};

    if (!bulkFormData.variantId?.trim()) newErrors.variantId = 'Chọn biến thể bắt buộc';
    if (!bulkFormData.imeiList?.trim()) newErrors.imeiList = 'Danh sách IMEI bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateGenerateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!generateFormData.variantId?.trim()) newErrors.variantId = 'Chọn biến thể bắt buộc';
    if (!generateFormData.prefix?.trim()) newErrors.prefix = 'Tiền tố bắt buộc';
    if (generateFormData.quantity <= 0) newErrors.quantity = 'Số lượng phải lớn hơn 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBulkImport = async () => {
    if (!validateBulkForm()) return;

    setIsLoading(true);
    try {
      const imeiList = bulkFormData.imeiList
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (imeiList.length === 0) {
        toast.error('Danh sách IMEI không hợp lệ');
        setIsLoading(false);
        return;
      }

      const payload = {
        variantId: bulkFormData.variantId,
        colorId: bulkFormData.colorId || undefined,
        imeiList,
      };

      await inventoryUnitApi.bulkImport(payload);
      toast.success(`Đã nhập ${imeiList.length} IMEI thành công!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error importing IMEIs:', error);
      toast.error(error?.response?.data?.message || 'Lỗi khi nhập IMEI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!validateGenerateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        variantId: generateFormData.variantId,
        prefix: generateFormData.prefix,
        startSequence: generateFormData.startSequence,
        quantity: generateFormData.quantity,
      };

      await inventoryUnitApi.generateRange(payload);
      toast.success(`Đã tạo ${generateFormData.quantity} IMEI thành công!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error generating IMEIs:', error);
      toast.error(error?.response?.data?.message || 'Lỗi khi tạo IMEI');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Quản lý IMEI (Kho hàng)</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setImportMode('bulk');
              setErrors({});
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              importMode === 'bulk'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nhập danh sách
          </button>
          <button
            onClick={() => {
              setImportMode('generate');
              setErrors({});
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              importMode === 'generate'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tự động tạo
          </button>
        </div>

        {importMode === 'bulk' ? (
          <div className="space-y-4">
            {/* Variant Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biến thể *
              </label>
              <select
                value={bulkFormData.variantId}
                onChange={(e) => setBulkFormData({ ...bulkFormData, variantId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.variantId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Chọn biến thể --</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.variantType}: {variant.variantValue}
                  </option>
                ))}
              </select>
              {errors.variantId && <p className="text-red-500 text-xs mt-1">{errors.variantId}</p>}
            </div>

            {/* Color Select (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Màu sắc (tùy chọn)
              </label>
              <select
                value={bulkFormData.colorId}
                onChange={(e) => setBulkFormData({ ...bulkFormData, colorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Không có màu --</option>
                {colors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.colorName}
                  </option>
                ))}
              </select>
            </div>

            {/* IMEI List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh sách IMEI *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Nhập mỗi IMEI trên một dòng (VD: CAM-2024-001)
              </p>
              <textarea
                value={bulkFormData.imeiList}
                onChange={(e) => setBulkFormData({ ...bulkFormData, imeiList: e.target.value })}
                placeholder="CAM-2024-001&#10;CAM-2024-002&#10;CAM-2024-003"
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm ${
                  errors.imeiList ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.imeiList && <p className="text-red-500 text-xs mt-1">{errors.imeiList}</p>}
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
                onClick={handleBulkImport}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang nhập...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Nhập IMEI
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Variant Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biến thể *
              </label>
              <select
                value={generateFormData.variantId}
                onChange={(e) => setGenerateFormData({ ...generateFormData, variantId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.variantId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Chọn biến thể --</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.variantType}: {variant.variantValue}
                  </option>
                ))}
              </select>
              {errors.variantId && <p className="text-red-500 text-xs mt-1">{errors.variantId}</p>}
            </div>

            {/* Prefix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiền tố *
              </label>
              <input
                type="text"
                value={generateFormData.prefix}
                onChange={(e) => setGenerateFormData({ ...generateFormData, prefix: e.target.value })}
                placeholder="VD: CAM-2024-"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.prefix ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.prefix && <p className="text-red-500 text-xs mt-1">{errors.prefix}</p>}
            </div>

            {/* Start Sequence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bắt đầu từ số
              </label>
              <input
                type="number"
                value={generateFormData.startSequence}
                onChange={(e) => setGenerateFormData({ ...generateFormData, startSequence: parseInt(e.target.value) })}
                placeholder="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng *
              </label>
              <input
                type="number"
                value={generateFormData.quantity}
                onChange={(e) => setGenerateFormData({ ...generateFormData, quantity: parseInt(e.target.value) })}
                placeholder="100"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Sẽ tạo IMEI từ
                <br />
                <code className="font-mono text-xs">
                  {generateFormData.prefix}
                  {String(generateFormData.startSequence).padStart(3, '0')}
                </code>
                {' '}đến{' '}
                <code className="font-mono text-xs">
                  {generateFormData.prefix}
                  {String(
                    generateFormData.startSequence + generateFormData.quantity - 1
                  ).padStart(3, '0')}
                </code>
              </p>
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
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Tạo IMEI
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryUnitModal;
