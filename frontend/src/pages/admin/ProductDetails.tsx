import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw, Loader2, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  productApi,
  productVariantApi,
  productColorApi,
  productAttributeApi,
  inventoryUnitApi,
} from '../../utils/api';
import ProductVariantModal from '../../components/admin-modal/ProductVariantModal';
import ProductColorModal from '../../components/admin-modal/ProductColorModal';
import ProductAttributeModal from '../../components/admin-modal/ProductAttributeModal';
import InventoryUnitModal from '../../components/admin-modal/InventoryUnitModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { ProductDetail, ProductVariant, ProductColor, ProductAttribute } from '../../types/types';

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'variants' | 'colors' | 'attributes' | 'inventory'>('variants');
  const [isLoading, setIsLoading] = useState(true);

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: string; id: string | null }>({
    isOpen: false,
    type: '',
    id: null,
  });

  // Colors
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

  // Attributes
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);

  // Inventory
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  // Map variantId -> list of IMEI units
  const [imeiMap, setImeiMap] = useState<Record<string, any[]>>({});
  const [imeiLoading, setImeiLoading] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    if (product?.id) {
      loadDataForTab(activeTab);
    }
  }, [activeTab, product?.id]);

  const loadProductDetails = async () => {
    if (!productId) return;
    try {
      setIsLoading(true);
      const data = await productApi.getById(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Lỗi tải thông tin sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataForTab = async (tab: typeof activeTab) => {
    if (!product?.id) return;
    try {
      setIsLoading(true);
      switch (tab) {
        case 'variants':
          const variantsData = await productVariantApi.getByProduct(product.id);
          setVariants(variantsData || []);
          break;
        case 'colors':
          const colorsData = await productColorApi.getByProduct(product.id);
          setColors(colorsData || []);
          break;
        case 'attributes':
          const attributesData = await productAttributeApi.getByProduct(product.id);
          setAttributes(attributesData || []);
          break;
        case 'inventory':
          await loadImeiForAllVariants();
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const loadImeiForAllVariants = async () => {
    if (!product?.id) return;
    setImeiLoading(true);
    try {
      const variantsData = await productVariantApi.getByProduct(product.id);
      const allVariants: ProductVariant[] = variantsData || [];
      const results: Record<string, any[]> = {};
      await Promise.all(
        allVariants.map(async (v) => {
          try {
            const units = await inventoryUnitApi.getByVariant(v.id);
            results[v.id] = Array.isArray(units) ? units : (units?.content || []);
          } catch {
            results[v.id] = [];
          }
        })
      );
      setImeiMap(results);
      setVariants(allVariants);
    } catch (error) {
      toast.error('Lỗi tải danh sách IMEI');
    } finally {
      setImeiLoading(false);
    }
  };

  // Variant handlers
  const handleVariantEdit = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setIsVariantModalOpen(true);
  };

  const handleVariantDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, type: 'variant', id });
  };

  const confirmVariantDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await productVariantApi.delete(deleteConfirm.id);
      toast.success('Xóa biến thể thành công!');
      loadDataForTab('variants');
    } catch (error) {
      toast.error('Lỗi xóa biến thể');
    } finally {
      setDeleteConfirm({ isOpen: false, type: '', id: null });
    }
  };

  // Color handlers
  const handleColorEdit = (color: ProductColor) => {
    setSelectedColor(color);
    setIsColorModalOpen(true);
  };

  const handleColorDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, type: 'color', id });
  };

  const confirmColorDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await productColorApi.delete(deleteConfirm.id);
      toast.success('Xóa màu sắc thành công!');
      loadDataForTab('colors');
    } catch (error) {
      toast.error('Lỗi xóa màu sắc');
    } finally {
      setDeleteConfirm({ isOpen: false, type: '', id: null });
    }
  };

  // Attribute handlers
  const handleAttributeEdit = (attr: ProductAttribute) => {
    setSelectedAttribute(attr);
    setIsAttributeModalOpen(true);
  };

  const handleAttributeDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, type: 'attribute', id });
  };

  const confirmAttributeDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await productAttributeApi.delete(deleteConfirm.id);
      toast.success('Xóa thuộc tính thành công!');
      loadDataForTab('attributes');
    } catch (error) {
      toast.error('Lỗi xóa thuộc tính');
    } finally {
      setDeleteConfirm({ isOpen: false, type: '', id: null });
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedVariant(null);
    setSelectedColor(null);
    setSelectedAttribute(null);
  };

  if (isLoading && !product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Không tìm thấy sản phẩm</p>
        <button
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin', { state: { tab: 'products' } })}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Danh sách sản phẩm</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">{product.name}</h1>
          <p className="text-gray-500">SKU: {product.sku}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'variants', label: 'Biến thể' },
            { key: 'colors', label: 'Màu sắc' },
            { key: 'attributes', label: 'Thuộc tính' },
            { key: 'inventory', label: 'Kho hàng (IMEI)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as typeof activeTab)}
              className={`px-6 py-3 font-medium transition border-b-2 ${
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Danh sách Biến thể</h2>
                <button
                  onClick={() => {
                    setSelectedVariant(null);
                    setIsVariantModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Thêm biến thể
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                </div>
              ) : variants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Loại</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Giá trị</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">SKU</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Giá điều chỉnh</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {variants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{variant.variantType}</td>
                          <td className="px-4 py-2">{variant.variantValue}</td>
                          <td className="px-4 py-2">{variant.sku}</td>
                          <td className="px-4 py-2">
                            {variant.priceAdjustment > 0 ? '+' : ''}
                            {variant.priceAdjustment.toLocaleString()}đ
                          </td>
                          <td className="px-4 py-2 flex justify-end gap-2">
                            <button
                              onClick={() => handleVariantEdit(variant)}
                              className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVariantDelete(variant.id)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có biến thể nào</p>
              )}
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Danh sách Màu sắc</h2>
                <button
                  onClick={() => {
                    setSelectedColor(null);
                    setIsColorModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Thêm màu sắc
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                </div>
              ) : colors.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {colors.map((color) => (
                    <div key={color.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                      {color.imageUrl && (
                        <img
                          src={color.imageUrl}
                          alt={color.colorName}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color.hexCode }}
                          />
                          <h3 className="font-semibold">{color.colorName}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{color.hexCode}</p>
                        {color.description && (
                          <p className="text-sm text-gray-600 mb-3">{color.description}</p>
                        )}
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleColorEdit(color)}
                            className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleColorDelete(color.id)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có màu sắc nào</p>
              )}
            </div>
          )}

          {/* Attributes Tab */}
          {activeTab === 'attributes' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Danh sách Thuộc tính</h2>
                <button
                  onClick={() => {
                    setSelectedAttribute(null);
                    setIsAttributeModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Thêm thuộc tính
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                </div>
              ) : attributes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Khóa</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Tên</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Giá trị</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Loại</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Đơn vị</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attributes.map((attr) => (
                        <tr key={attr.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{attr.attributeKey}</td>
                          <td className="px-4 py-2 text-sm">{attr.attributeName}</td>
                          <td className="px-4 py-2 text-sm">{attr.attributeValue}</td>
                          <td className="px-4 py-2 text-sm">{attr.valueType}</td>
                          <td className="px-4 py-2 text-sm">{attr.unit || '—'}</td>
                          <td className="px-4 py-2 flex justify-end gap-2">
                            <button
                              onClick={() => handleAttributeEdit(attr)}
                              className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAttributeDelete(attr.id)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Chưa có thuộc tính nào</p>
              )}
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Quản lý Kho hàng (IMEI)</h2>
                <button
                  onClick={() => setIsInventoryModalOpen(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Nhập IMEI
                </button>
              </div>

              {imeiLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                  <p className="text-sm text-gray-500 mt-2">Đang tải dữ liệu IMEI...</p>
                </div>
              ) : variants.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 border-2 border-dashed rounded-lg">
                  <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Sản phẩm chưa có biến thể nào. Hãy thêm biến thể trước khi nhập IMEI.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {variants.map((variant) => {
                    const units: any[] = imeiMap[variant.id] || [];
                    const available = units.filter(u => u.unitStatus === 'AVAILABLE').length;
                    const sold = units.filter(u => u.unitStatus === 'SOLD').length;
                    const reserved = units.filter(u => u.unitStatus === 'RESERVED').length;
                    const damaged = units.filter(u => u.unitStatus === 'DAMAGED').length;
                    return (
                      <div key={variant.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Variant header */}
                        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
                          <div>
                            <span className="font-semibold text-gray-800">{variant.variantType}: {variant.variantValue}</span>
                            <span className="ml-3 text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded border">{variant.sku}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-medium">
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">✔ {available} sẵn có</span>
                            {reserved > 0 && <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">⏳ {reserved} đặt</span>}
                            {sold > 0 && <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">📦 {sold} đã bán</span>}
                            {damaged > 0 && <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">⚠ {damaged} hỏng</span>}
                            <span className="text-gray-500">Tổng: {units.length}</span>
                          </div>
                        </div>

                        {/* IMEI list */}
                        {units.length === 0 ? (
                          <div className="px-5 py-6 text-center text-sm text-gray-400 italic">
                            Chưa có IMEI nào cho biến thể này. Nhấn "Nhập IMEI" để thêm.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-600">IMEI / Serial</th>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Trạng thái</th>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Màu sắc</th>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Vị trí kho</th>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Ghi chú</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {units.map((unit: any) => (
                                  <tr key={unit.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-mono text-xs font-semibold text-gray-800">{unit.imeiSerial}</td>
                                    <td className="px-4 py-2">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        unit.unitStatus === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                        unit.unitStatus === 'SOLD'      ? 'bg-blue-100 text-blue-700' :
                                        unit.unitStatus === 'RESERVED'  ? 'bg-yellow-100 text-yellow-700' :
                                        unit.unitStatus === 'RETURNED'  ? 'bg-purple-100 text-purple-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {unit.unitStatus === 'AVAILABLE' ? 'Sẵn có' :
                                         unit.unitStatus === 'SOLD'      ? 'Đã bán' :
                                         unit.unitStatus === 'RESERVED'  ? 'Đặt hàng' :
                                         unit.unitStatus === 'RETURNED'  ? 'Trả lại' : 'Hỏng'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-500">{unit.color?.colorName || '—'}</td>
                                    <td className="px-4 py-2 text-xs text-gray-500 font-mono">{unit.warehouseLocation || '—'}</td>
                                    <td className="px-4 py-2 text-xs text-gray-400 max-w-[180px] truncate">{unit.notes || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProductVariantModal
        isOpen={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setSelectedVariant(null);
        }}
        productId={product.id}
        variant={selectedVariant || undefined}
        onSuccess={() => loadDataForTab('variants')}
      />

      <ProductColorModal
        isOpen={isColorModalOpen}
        onClose={() => {
          setIsColorModalOpen(false);
          setSelectedColor(null);
        }}
        productId={product.id}
        color={selectedColor || undefined}
        onSuccess={() => loadDataForTab('colors')}
      />

      <ProductAttributeModal
        isOpen={isAttributeModalOpen}
        onClose={() => {
          setIsAttributeModalOpen(false);
          setSelectedAttribute(null);
        }}
        productId={product.id}
        attribute={selectedAttribute || undefined}
        onSuccess={() => loadDataForTab('attributes')}
      />

      <InventoryUnitModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        productId={product.id}
        onSuccess={() => {
          toast.success('Cập nhật kho hàng thành công!');
          loadImeiForAllVariants();
        }}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        title="Xác nhận xóa"
        message={`Bạn chắc chắn muốn xóa ${deleteConfirm.type}?`}
        confirmText="Xóa"
        onConfirm={() => {
          if (deleteConfirm.type === 'variant') confirmVariantDelete();
          else if (deleteConfirm.type === 'color') confirmColorDelete();
          else if (deleteConfirm.type === 'attribute') confirmAttributeDelete();
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: '', id: null })}
      />
    </div>
  );
};

export default ProductDetails;
