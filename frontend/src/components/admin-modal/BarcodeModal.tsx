import React, { useEffect, useRef, useState } from 'react';
import Barcode from 'react-barcode';
import { X, Plus, Trash2, Printer, RefreshCw, Barcode as BarcodeIcon } from 'lucide-react';
import { BarcodeApi } from '../../utils/api';
import { toast } from 'react-toastify';
import type { ProductSummary } from '../../types/types';

interface BarcodeItem {
    id: number;
    barcode: string;
    serialNumber?: string;
    createdAt: string;
}

interface Props {
    isOpen: boolean;
    product: ProductSummary | null;
    onClose: () => void;
}

const BarcodeModal: React.FC<Props> = ({ isOpen, product, onClose }) => {
    const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [newBarcode, setNewBarcode] = useState('');
    const [creating, setCreating] = useState(false);
    const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && product) {
            loadBarcodes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, product]);

    const loadBarcodes = async () => {
        if (!product) return;
        setLoading(true);
        try {
            const data = await BarcodeApi.getByProduct(product.id);
            setBarcodes(data as BarcodeItem[]);
            if (data.length > 0) {
                setSelectedBarcode((data[0] as BarcodeItem).barcode);
            }
        } catch {
            toast.error('Không thể tải danh sách mã vạch');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!product || !newBarcode.trim()) return;
        setCreating(true);
        try {
            await BarcodeApi.create({ barcode: newBarcode.trim(), productId: product.id });
            toast.success('Tạo mã vạch thành công!');
            setNewBarcode('');
            loadBarcodes();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Mã vạch đã tồn tại hoặc không hợp lệ');
        } finally {
            setCreating(false);
        }
    };

    const handleAutoGenerate = async () => {
        if (!product) return;
        setCreating(true);
        try {
            await BarcodeApi.autoGenerate(product.id, (product as any).sku || '');
            toast.success('Tự động tạo mã vạch thành công!');
            loadBarcodes();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Không thể tạo mã vạch tự động');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await BarcodeApi.delete(id);
            toast.success('Đã xóa mã vạch');
            if (barcodes.find(b => b.id === id)?.barcode === selectedBarcode) {
                setSelectedBarcode(null);
            }
            loadBarcodes();
        } catch {
            toast.error('Không thể xóa mã vạch');
        }
    };

    const handlePrint = () => {
        if (!selectedBarcode) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const barcodeEl = printRef.current?.innerHTML || '';
        printWindow.document.write(`
            <html>
            <head>
                <title>In mã vạch - ${product?.name}</title>
                <style>
                    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .product-name { font-size: 14px; font-weight: bold; margin-bottom: 8px; text-align: center; max-width: 200px; }
                    .barcode-value { font-size: 11px; color: #666; margin-top: 4px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="product-name">${product?.name}</div>
                ${barcodeEl}
                <div class="barcode-value">${selectedBarcode}</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BarcodeIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Quản lý mã vạch</h2>
                            <p className="text-sm text-gray-500 line-clamp-1">{product.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col lg:flex-row gap-5">
                    {/* Left: Barcode list + Create */}
                    <div className="flex-1">
                        {/* Create new barcode */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thêm mã vạch mới</h3>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newBarcode}
                                    onChange={e => setNewBarcode(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                                    placeholder="Nhập mã vạch..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !newBarcode.trim()}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tạo
                                </button>
                            </div>
                            <button
                                onClick={handleAutoGenerate}
                                disabled={creating}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-indigo-300 text-indigo-600 text-sm rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tự động tạo barcode (EAN-13)
                            </button>
                        </div>

                        {/* List */}
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Danh sách mã vạch ({barcodes.length})
                        </h3>
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-gray-400">
                                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                Đang tải...
                            </div>
                        ) : barcodes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <BarcodeIcon className="w-12 h-12 mb-2 opacity-30" />
                                <p className="text-sm">Chưa có mã vạch nào</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {barcodes.map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => setSelectedBarcode(b.barcode)}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedBarcode === b.barcode
                                                ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div>
                                            <p className="font-mono text-sm font-semibold text-gray-800">{b.barcode}</p>
                                            {b.serialNumber && (
                                                <p className="text-xs text-gray-500">S/N: {b.serialNumber}</p>
                                            )}
                                            <p className="text-xs text-gray-400">
                                                {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa mã vạch"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Preview + Print */}
                    <div className="w-full lg:w-72 flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Xem trước & In</h3>
                        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-4 min-h-[200px]">
                            {selectedBarcode ? (
                                <>
                                    <p className="text-xs text-gray-500 mb-2 text-center line-clamp-2 font-medium">
                                        {product.name}
                                    </p>
                                    <div ref={printRef} className="bg-white p-2 rounded-lg shadow-sm">
                                        <Barcode
                                            value={selectedBarcode}
                                            format="CODE128"
                                            width={1.5}
                                            height={60}
                                            fontSize={11}
                                            displayValue={true}
                                        />
                                    </div>
                                    <button
                                        onClick={handlePrint}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-md transition-all"
                                    >
                                        <Printer className="w-4 h-4" />
                                        In mã vạch
                                    </button>
                                </>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <BarcodeIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Chọn mã vạch để xem trước</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeModal;
