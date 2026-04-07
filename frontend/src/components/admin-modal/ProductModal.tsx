import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Save, Loader2, Plus, ArrowRight, ArrowLeft, Trash2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';

// ============ Auto-generate Helpers ============
const slugifyVN = (str: string): string => {
  return str
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9\s]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .substring(0, 20).replace(/-$/, '');
};
const calcEAN13Check = (base12: string): number => {
  const d = base12.split('').map(Number);
  const s = d.reduce((a, v, i) => a + v * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (s % 10)) % 10;
};
const generateSKU = (name: string): string => {
  const slug = slugifyVN(name) || 'SP';
  return `${slug}-${(Date.now() % 1000).toString().padStart(3, '0')}`;
};
const generateBarcode = (): string => {
  const r = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  const t = (Date.now() % 10000).toString().padStart(4, '0');
  const b = `8938${r}${t}`;
  return b + calcEAN13Check(b);
};
const generateVariantSKU = (parentSku: string, variantValue: string, idx: number): string => {
  const s = (slugifyVN(variantValue) || 'V').substring(0, 8);
  return `${parentSku || 'SP'}-${s}-${idx}`;
};
const generateIMEIRange = (prefix: string, start: number, qty: number): string[] =>
  Array.from({ length: qty }, (_, i) =>
    `${prefix.trim().toUpperCase()}${String(start + i).padStart(3, '0')}`);
// ===============================================
import { toast } from 'react-toastify';
import {
  productApi, categoryApi, brandApi, InventoryApi, BarcodeApi,
  productColorApi, productVariantApi, productAttributeApi, inventoryUnitApi
} from '../../utils/api';
import { imageUploadService } from '../../utils/imageUploadService';
import type { ProductDetail, CategorySummary, Brand } from '../../types/types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductDetail;
  onSuccess: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}) => {
  const isEditing = !!product;
  const TOTAL_STEPS = isEditing ? 1 : 4;

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    listedPrice: 0,
    price: 0,
    categoryId: '',
    brandId: '',
    shortDesc: '',
    longDesc: '',
    active: true,
    features: [] as string[],
    specifications: {} as Record<string, string>,
    availableStock: 0,
    rating: 0,
    reviewCount: 0,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

  // Wizard States
  const [newColors, setNewColors] = useState<{ colorName: string, hexCode: string }[]>([]);
  const [newVariants, setNewVariants] = useState<{ variantType: string, variantValue: string, sku: string, priceAdjustment: number }[]>([]);
  const [newAttributes, setNewAttributes] = useState<{ attributeKey: string, attributeName: string, attributeValue: string, valueType: string }[]>([]);
  const [newImeis, setNewImeis] = useState<Record<number, string>>({}); // mapped by variant index
  const [imeiGenConfig, setImeiGenConfig] = useState<Record<number, { prefix: string; start: number; qty: number; open: boolean }>>({});
  const updateImeiGen = (i: number, patch: Partial<{ prefix: string; start: number; qty: number; open: boolean }>) =>
    setImeiGenConfig(prev => {
      const cur = prev[i] ?? { prefix: '', start: 1, qty: 10, open: false };
      return { ...prev, [i]: { ...cur, ...patch } };
    });

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadBrands();
    }
  }, [isOpen]);

  useEffect(() => {
    if (product && isOpen) {
      const initFormData = async () => {
        let fetchedBarcode = '';
        try {
          const barcodes = await BarcodeApi.getByProduct(product.id);
          if (barcodes && barcodes.length > 0) {
            fetchedBarcode = barcodes[0].barcode;
          }
        } catch (err) {
          console.error("Lỗi tải barcode cho sản phẩm", err);
        }

        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          barcode: fetchedBarcode,
          listedPrice: product.listedPrice || 0,
          price: product.price || 0,
          categoryId: product.category?.id?.toString() || '',
          brandId: product.brand?.id?.toString() || '',
          shortDesc: product.shortDesc || '',
          longDesc: product.longDesc || '',
          active: product.active ?? true,
          features: product.features || [],
          specifications: product.specifications || {},
          availableStock: product.availableStock || 0,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
        });
        setThumbnailPreview(product.thumbnailUrl || null);
        setExistingMediaUrls(product.mediaAssets?.map(m => m.url || '') || []);
      };
      initFormData();
    } else {
      resetForm();
    }
  }, [product, isOpen]);

  const loadCategories = async () => {
    try {
      const data = await categoryApi.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải danh sách danh mục');
      setCategories([]);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await brandApi.getAll({ page: 0, size: 100 });
      setBrands(Array.isArray(response.content) ? response.content : []);
    } catch {
      toast.error('Không thể tải danh sách thương hiệu');
      setBrands([]);
    }
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateImageFile(file)) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, thumbnail: '' }));
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(validateImageFile);
    setMediaFiles((prev) => [...prev, ...validFiles]);
    setMediaPreviews((prev) => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
    setErrors((prev) => ({ ...prev, media: '' }));
  };

  const validateImageFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ file: 'Kích thước file phải nhỏ hơn 5MB' });
      return false;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors({ file: 'Chỉ chấp nhận file JPEG, PNG, WebP' });
      return false;
    }
    return true;
  };

  const removeMediaPreview = (index: number) => {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    const urlToRemove = existingMediaUrls[index];
    setExistingMediaUrls((prev) => prev.filter((_, i) => i !== index));
    if (urlToRemove) setMediaToDelete((prev) => [...prev, urlToRemove]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < TOTAL_STEPS && !isEditing) {
      // Validate basic info before next
      if (!formData.name.trim() || !formData.sku.trim() || !formData.categoryId || !formData.price) {
        toast.error("Vui lòng điền các trường bắt buộc (*) trước khi tiếp tục");
        return;
      }
      if (!thumbnailPreview) {
        toast.error("Vui lòng chọn ảnh đại diện");
        return;
      }
      setCurrentStep(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    let uploadedThumbnail = product?.thumbnailUrl || null;
    let uploadedMediaUrls: string[] = [...existingMediaUrls];
    const oldThumbnailUrl = product?.thumbnailUrl || null;

    try {
      if (thumbnailFile) {
        const result = await imageUploadService.uploadImage(thumbnailFile);
        uploadedThumbnail = result.url;
      }

      if (mediaFiles.length > 0) {
        const mediaUploads = await Promise.all(mediaFiles.map(file => imageUploadService.uploadImage(file)));
        uploadedMediaUrls = [...uploadedMediaUrls, ...mediaUploads.map(u => u.url)];
      }

      const productData: any = {
        ...(isEditing && { id: product.id }),
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        listedPrice: formData.listedPrice,
        price: formData.price,
        category: { id: parseInt(formData.categoryId) },
        brand: formData.brandId ? { id: parseInt(formData.brandId) } : null,
        shortDesc: formData.shortDesc.trim(),
        longDesc: formData.longDesc.trim(),
        active: formData.active,
        thumbnailUrl: uploadedThumbnail,
        mediaAssets: uploadedMediaUrls.map(url => ({ url, altText: formData.name })),
        features: formData.features.filter(f => f.trim() !== ''),
        specifications: formData.specifications,
        rating: formData.rating,
        reviewCount: formData.reviewCount,
        availableStock: formData.availableStock,
        reviews: product?.reviews || [],
        ...(isEditing && {
          createdAt: product.createdAt,
          updatedAt: new Date().toISOString(),
          deletedAt: product.deletedAt,
        }),
      };

      if (isEditing) {
        await productApi.update(product.id, productData);
        if (formData.availableStock !== product.availableStock) {
          const stockChange = formData.availableStock - (product.availableStock || 0);
          try {
            await InventoryApi.updateStock(product.id, stockChange);
          } catch (invError: any) {
            if (invError.response?.status === 404) {
              await InventoryApi.create({ productId: product.id, onHand: formData.availableStock, reserved: 0 });
            }
          }
        }
      } else {
        const savedProduct = await productApi.create(productData);
        const newProductId = savedProduct?.id;

        if (formData.barcode.trim() && newProductId) {
          try {
            await BarcodeApi.create({ barcode: formData.barcode.trim(), productId: newProductId });
          } catch (err: any) {
            toast.error('Lưu mã vạch thất bại: ' + (err.response?.data?.message || 'Mã vạch đã tồn tại'));
          }
        }

        // ================= WIZARD SUBMISSIONS =================
        if (newProductId) {
          // 1. Create Colors
          if (newColors.length > 0) {
            await Promise.all(newColors.map(c => productColorApi.create(newProductId, { ...c, active: true })));
          }

          // 2. Create Variants
          const createdVariants: any[] = [];
          for (const varData of newVariants) {
            const res = await productVariantApi.create(newProductId, { ...varData, active: true });
            createdVariants.push(res);
          }

          // 3. Create Attributes
          if (newAttributes.length > 0) {
            await Promise.all(newAttributes.map(a => productAttributeApi.create(newProductId, a)));
          }

          // 4. Create IMEIs mapped to variant
          for (let i = 0; i < createdVariants.length; i++) {
            const imeiString = newImeis[i];
            if (imeiString && imeiString.trim() !== '') {
              const imeiList = imeiString.split(',').map(s => s.trim()).filter(s => s !== '');
              if (imeiList.length > 0) {
                await inventoryUnitApi.bulkImport({
                  variantId: createdVariants[i].id,
                  imeiList: imeiList
                });
              }
            }
          }
        }
      }

      if (thumbnailFile && oldThumbnailUrl && oldThumbnailUrl !== uploadedThumbnail) {
        await imageUploadService.deleteImage(oldThumbnailUrl).catch(console.error);
      }

      for (const urlToDelete of mediaToDelete) {
        await imageUploadService.deleteImage(urlToDelete).catch(console.error);
      }

      toast.success(isEditing ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Submit Error:", error.response?.data);
      if (!isEditing && uploadedThumbnail && thumbnailFile) {
        imageUploadService.deleteImage(uploadedThumbnail).catch(console.error);
      }
      let errorMsg = 'Có lỗi xảy ra khi lưu sản phẩm';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') errorMsg = error.response.data;
        else if (error.response.data.message) errorMsg = error.response.data.message;
        else if (error.response.data.errors) {
          errorMsg = Object.values(error.response.data.errors).join(', ');
        }
      }
      setErrors({ submit: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: '', sku: '', barcode: '', listedPrice: 0, price: 0, categoryId: '', brandId: '',
      shortDesc: '', longDesc: '', active: true, features: [], specifications: {},
      availableStock: 0, rating: 0, reviewCount: 0,
    });
    setNewColors([]); setNewVariants([]); setNewAttributes([]); setNewImeis({}); setImeiGenConfig({});
    setThumbnailFile(null); setThumbnailPreview(null);
    setMediaFiles([]); setMediaPreviews([]); setExistingMediaUrls([]); setMediaToDelete([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // --- RENDER HELPERS ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm <span className="text-red-500">*</span></label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" disabled={isLoading} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SKU <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500" disabled={isLoading} />
            <button type="button"
              onClick={() => setFormData({ ...formData, sku: generateSKU(formData.name) })}
              disabled={isLoading || !formData.name.trim()}
              title={!formData.name.trim() ? 'Nhập tên sản phẩm trước' : 'Tạo SKU tự động'}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold whitespace-nowrap">
              <Wand2 className="w-3.5 h-3.5" /> Tạo SKU
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mã vạch</label>
          <div className="flex gap-2">
            <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" disabled={isLoading || isEditing}
              title={isEditing ? 'Hiện chưa hỗ trợ sửa mã vạch trên UI' : ''} />
            {!isEditing && (
              <button type="button"
                onClick={() => setFormData({ ...formData, barcode: generateBarcode() })}
                disabled={isLoading}
                title="Tạo mã vạch EAN-13 tự động"
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold whitespace-nowrap">
                <Wand2 className="w-3.5 h-3.5" /> Tạo mã
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Giá niêm yết (₫)</label>
          <input type="number" value={formData.listedPrice} onChange={(e) => setFormData({ ...formData, listedPrice: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={isLoading} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán (₫) <span className="text-red-500">*</span></label>
          <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={isLoading} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho</label>
        <input type="number" value={formData.availableStock} onChange={(e) => setFormData({ ...formData, availableStock: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={isLoading} min="0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục <span className="text-red-500">*</span></label>
          <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={isLoading}>
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thương hiệu</label>
          <select value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={isLoading}>
            <option value="">Chọn thương hiệu</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả ngắn</label>
        <textarea value={formData.shortDesc} onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })} rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết</label>
        <textarea value={formData.longDesc} onChange={(e) => setFormData({ ...formData, longDesc: e.target.value })} rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-4">
          {thumbnailPreview ? (
            <div className="relative">
              <img src={thumbnailPreview} alt="Thumbnail" className="w-24 h-24 object-cover rounded-lg border" />
              <button type="button" onClick={removeThumbnail} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" /><span>Chọn ảnh</span>
            </button>
          )}
          {thumbnailPreview && (
            <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" /><span>Đổi ảnh</span>
            </button>
          )}
          <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} className="hidden" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh sản phẩm (tối đa 10 ảnh)</label>
        <div className="grid grid-cols-5 gap-4 mb-4">
          {existingMediaUrls.map((url, index) => (
            <div key={`existing-${index}`} className="relative">
              <img src={url} alt={`Media`} className="w-full h-24 object-cover rounded-lg border" />
              <button type="button" onClick={() => removeExistingMedia(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {mediaPreviews.map((preview, index) => (
            <div key={`new-${index}`} className="relative">
              <img src={preview} alt={`Preview`} className="w-full h-24 object-cover rounded-lg border" />
              <button type="button" onClick={() => removeMediaPreview(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {(existingMediaUrls.length + mediaPreviews.length) < 10 && (
            <button type="button" onClick={() => mediaInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-purple-500 cursor-pointer">
              <Plus className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>
        <input ref={mediaInputRef} type="file" accept="image/*" multiple onChange={handleMediaSelect} className="hidden" />
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" disabled={isLoading} />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">Kích hoạt sản phẩm</label>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <h4 className="font-semibold text-indigo-900 mb-2">Tùy chọn Màu sắc & Biến thể</h4>
        <p className="text-sm text-indigo-700">Thêm các loại màu và biến thể (Ví dụ: Cam 2MP, Lens tĩnh...) nếu sản phẩm của bạn có nhiều lựa chọn (tuỳ chọn).</p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-800">Màu sắc</h4>
          <button type="button" onClick={() => setNewColors([...newColors, { colorName: '', hexCode: '#000000' }])} className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition">+ Thêm màu</button>
        </div>
        {newColors.map((c, i) => (
          <div key={i} className="flex gap-4 mb-3 items-center">
            <input type="text" placeholder="Tên màu (VD: Đen, Trắng)" value={c.colorName} onChange={e => { const nc = [...newColors]; nc[i].colorName = e.target.value; setNewColors(nc); }} className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500" />
            <div className="flex items-center gap-2">
              <input type="color" value={c.hexCode} onChange={e => { const nc = [...newColors]; nc[i].hexCode = e.target.value; setNewColors(nc); }} className="w-10 h-10 border rounded cursor-pointer p-0.5 bg-white" />
              <span className="text-sm text-gray-500 w-20 font-mono">{c.hexCode}</span>
            </div>
            <button type="button" onClick={() => setNewColors(newColors.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {newColors.length === 0 && <p className="text-sm text-gray-400 italic">Sản phẩm chưa có thiết lập màu sắc riêng</p>}
      </div>

      <hr className="border-gray-200" />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-800">Phân loại / Biến thể</h4>
          <button type="button" onClick={() => setNewVariants([...newVariants, { variantType: '', variantValue: '', sku: '', priceAdjustment: 0 }])} className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition">+ Thêm biến thể</button>
        </div>
        {newVariants.map((v, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 mb-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
            <div className="col-span-3">
              <input type="text" placeholder="Loại (VD: Ống kính)" value={v.variantType} onChange={e => { const nv = [...newVariants]; nv[i].variantType = e.target.value; setNewVariants(nv); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="col-span-3">
              <input type="text" placeholder="Giá trị (VD: 3.6mm)" value={v.variantValue} onChange={e => { const nv = [...newVariants]; nv[i].variantValue = e.target.value; setNewVariants(nv); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="col-span-4">
              <div className="flex gap-1.5 items-center">
                <input type="text" placeholder="SKU phụ (VD: CAM-36)" value={v.sku} onChange={e => { const nv = [...newVariants]; nv[i].sku = e.target.value; setNewVariants(nv); }} className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500" />
                <button type="button"
                  onClick={() => { const nv = [...newVariants]; nv[i].sku = generateVariantSKU(formData.sku, v.variantValue, i); setNewVariants(nv); }}
                  disabled={!formData.sku.trim() && !v.variantValue.trim()}
                  title={!formData.sku.trim() ? 'Nhập SKU chính ở Bước 1 trước' : 'Tự sinh SKU phụ'}
                  className="flex-shrink-0 p-2 bg-purple-50 text-purple-500 border border-purple-200 rounded hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <Wand2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="col-span-1">
              <input type="number" placeholder="Chênh giá" value={v.priceAdjustment} onChange={e => { const nv = [...newVariants]; nv[i].priceAdjustment = parseFloat(e.target.value) || 0; setNewVariants(nv); }} className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="col-span-1 text-center">
              <button type="button" onClick={() => setNewVariants(newVariants.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {newVariants.length === 0 && <p className="text-sm text-gray-400 italic">Sản phẩm bán chung, chưa chia biến thể nhỏ</p>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-100 mb-4">
        <h4 className="font-semibold text-cyan-900 mb-2">Đặc tính kỹ thuật / Thuộc tính mở rộng</h4>
        <p className="text-sm text-cyan-700">Ví dụ: lens_type = Varifocal, ir_range = 50m, connectivity = WiFi</p>
      </div>
      <div className="flex justify-end mb-4">
        <button type="button" onClick={() => setNewAttributes([...newAttributes, { attributeKey: '', attributeName: '', attributeValue: '', valueType: 'string' }])} className="text-sm bg-cyan-100 text-cyan-700 px-3 py-1.5 rounded-lg hover:bg-cyan-200 transition">+ Thêm thuộc tính</button>
      </div>
      {newAttributes.map((a, i) => (
        <div key={i} className="flex gap-3 mb-3 bg-white p-3 rounded-lg border shadow-sm items-center">
          <input type="text" placeholder="Key (VD: range)" value={a.attributeKey} onChange={e => { const na = [...newAttributes]; na[i].attributeKey = e.target.value; setNewAttributes(na); }} className="flex-1 px-3 py-2 text-sm border-gray-300 border rounded focus:ring-2 focus:ring-cyan-500" />
          <input type="text" placeholder="Tên hiển thị (VD: Tầm nhìn xa)" value={a.attributeName} onChange={e => { const na = [...newAttributes]; na[i].attributeName = e.target.value; setNewAttributes(na); }} className="flex-1 px-3 py-2 text-sm border-gray-300 border rounded focus:ring-2 focus:ring-cyan-500" />
          <input type="text" placeholder="Giá trị (VD: 50m)" value={a.attributeValue} onChange={e => { const na = [...newAttributes]; na[i].attributeValue = e.target.value; setNewAttributes(na); }} className="flex-1 px-3 py-2 text-sm border-gray-300 border rounded focus:ring-2 focus:ring-cyan-500" />
          <select value={a.valueType} onChange={e => { const na = [...newAttributes]; na[i].valueType = e.target.value; setNewAttributes(na); }} className="w-28 py-2 px-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-cyan-500">
            <option value="string">Văn bản</option>
            <option value="number">Số</option>
            <option value="boolean">Bool (T/F)</option>
          </select>
          <button type="button" onClick={() => setNewAttributes(newAttributes.filter((_, idx) => idx !== i))} className="p-2 text-red-500 rounded-full hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      {newAttributes.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có thuộc tính bổ trợ nào</p>}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
        <h4 className="font-semibold text-green-900 mb-1">Nhập mã IMEI cho các biến thể</h4>
        <p className="text-sm text-green-700">Dán danh sách IMEI thủ công <strong>hoặc</strong> dùng công cụ tạo tự động bên dưới. IMEI tự động sẽ được thêm vào cuối danh sách.</p>
      </div>
      {newVariants.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 italic">
            Bạn chưa thêm Biến thể nào ở Bước 2. <br />
            Sản phẩm sẽ chỉ dùng tồn kho chung (nhập ở Bước 1) và không gắn IMEI chi tiết.
          </p>
        </div>
      ) : (
        newVariants.map((v, i) => {
          const cfg = imeiGenConfig[i] ?? { prefix: '', start: 1, qty: 10, open: false };
          const previewEnd = cfg.start + cfg.qty - 1;
          const previewStart = `${cfg.prefix.trim().toUpperCase()}${String(cfg.start).padStart(3, '0')}`;
          const previewEndStr = `${cfg.prefix.trim().toUpperCase()}${String(previewEnd).padStart(3, '0')}`;
          return (
            <div key={i} className="mb-5 bg-white border rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">
                  {v.variantType || 'Không Rõ'} — <span className="text-purple-600">{v.variantValue || '...'}</span>
                </span>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 border px-1.5 py-0.5 rounded">SKU: {v.sku || 'Chưa có'}</span>
              </div>

              <div className="p-4 space-y-3">
                {/* Auto-gen panel toggle */}
                <button type="button"
                  onClick={() => updateImeiGen(i, { open: !cfg.open })}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition text-sm font-medium">
                  <Wand2 className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">⚡ Tạo IMEI tự động</span>
                  {cfg.open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {cfg.open && (
                  <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-purple-800 mb-1">Tiền tố *</label>
                        <input type="text"
                          value={cfg.prefix}
                          onChange={e => updateImeiGen(i, { prefix: e.target.value })}
                          placeholder="VD: CAM-2024-"
                          className="w-full px-3 py-1.5 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 font-mono bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-purple-800 mb-1">Bắt đầu từ số</label>
                          <input type="number" min={1}
                            value={cfg.start}
                            onChange={e => updateImeiGen(i, { start: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-1.5 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-purple-800 mb-1">Số lượng</label>
                          <input type="number" min={1} max={500}
                            value={cfg.qty}
                            onChange={e => updateImeiGen(i, { qty: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-1.5 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white" />
                        </div>
                      </div>
                    </div>
                    {cfg.prefix.trim() && (
                      <p className="text-xs text-purple-600 font-mono bg-white border border-purple-100 px-2 py-1.5 rounded">
                        Preview: <strong>{previewStart}</strong> → <strong>{previewEndStr}</strong>
                        <span className="ml-2 text-purple-400">({cfg.qty} IMEI)</span>
                      </p>
                    )}
                    <button type="button"
                      onClick={() => {
                        if (!cfg.prefix.trim()) { return; }
                        const generated = generateIMEIRange(cfg.prefix, cfg.start, cfg.qty);
                        const existing = newImeis[i] ? newImeis[i].trim() : '';
                        const appended = existing ? `${existing},${generated.join(',')}` : generated.join(',');
                        setNewImeis({ ...newImeis, [i]: appended });
                        updateImeiGen(i, { open: false });
                      }}
                      disabled={!cfg.prefix.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <Plus className="w-4 h-4" /> Tạo và thêm vào danh sách
                    </button>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span>hoặc nhập thủ công</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Manual textarea */}
                <textarea
                  rows={3}
                  value={newImeis[i] || ''}
                  onChange={e => setNewImeis({ ...newImeis, [i]: e.target.value })}
                  placeholder="Nhập IMEI cách nhau bởi dấu phẩy, VD: 123456789, 987654321..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Số IMEI đếm được: <strong className="text-green-600">{newImeis[i] ? newImeis[i].split(',').filter(x => x.trim()).length : 0}</strong> chiếc</span>
                  {newImeis[i] && (
                    <button type="button" onClick={() => setNewImeis({ ...newImeis, [i]: '' })}
                      className="text-xs text-red-400 hover:text-red-600 transition">Xóa tất cả</button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b shrink-0 bg-white z-10 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Chỉnh sửa sản phẩm' : `Thêm sản phẩm mới (B. ${currentStep}/${TOTAL_STEPS})`}
          </h3>
          <button onClick={handleClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors" disabled={isLoading}>
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Wizard Steps Indication */}
        {!isEditing && (
          <div className="flex border-b px-8 pt-4 space-x-6 shrink-0 bg-gray-50">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`pb-3 text-sm font-semibold border-b-4 transition-all duration-300 ${currentStep === step ? 'border-purple-600 text-purple-700' : currentStep > step ? 'border-green-400 text-green-600 cursor-pointer' : 'border-transparent text-gray-400'}`} onClick={() => { if (currentStep > step) setCurrentStep(step) }}>
                {step === 1 ? '1. Cơ bản' : step === 2 ? '2. Màu & Biến thể' : step === 3 ? '3. Thuộc tính' : '4. Tồn kho IMEI'}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-gray-50/30">
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-sm text-red-700 shadow-sm">{errors.submit}</div>
          )}
          <form id="productForm" onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {!isEditing && currentStep === 2 && renderStep2()}
            {!isEditing && currentStep === 3 && renderStep3()}
            {!isEditing && currentStep === 4 && renderStep4()}
          </form>
        </div>

        <div className="p-5 border-t shrink-0 flex justify-between bg-white rounded-b-2xl items-center shadow-[0_-4px_6px_-6px_rgba(0,0,0,0.1)]">
          <div>
            {!isEditing && currentStep > 1 && (
              <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:bg-gray-100 font-medium rounded-xl transition-colors" disabled={isLoading}>
                <ArrowLeft className="w-5 h-5" /> Quay lại
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleClose} className="px-6 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors" disabled={isLoading}>
              Hủy
            </button>
            <button type="submit" form="productForm" className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Đang xử lý...</span></>
              ) : currentStep < TOTAL_STEPS ? (
                <><span>Tiếp tục thao tác</span><ArrowRight className="w-5 h-5" /></>
              ) : (
                <><Save className="w-5 h-5" /><span>{isEditing ? 'Cập nhật Sản phẩm' : 'Lưu tất cả'}</span></>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductModal;
