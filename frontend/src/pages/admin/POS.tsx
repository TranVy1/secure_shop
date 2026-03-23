import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    QrCode,
    Search,
    CheckCircle,
    X,
    AlertTriangle,
    Download,
    ScanLine,
    ChevronRight,
    Package2,
    LayoutGrid,
} from "lucide-react";
import { posApi, productApi, invoiceApi, categoryApi } from "../../utils/api";
import type { ProductSummary, CategorySummary } from "../../types/types";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CartItem {
    product: ProductSummary;
    quantity: number;
}

interface InvoiceItem {
    id: number;
    productId: string;
    productName: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
}
interface Invoice {
    id: string;
    invoiceCode: string;
    orderId: string;
    staffName: string;
    totalAmount: number;
    cashReceived: number;
    changeAmount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    items: InvoiceItem[];
}

type PayMethod = "COD" | "CARD" | "E_WALLET";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const vnd = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(n);

const payLabel = (m: string) =>
    m === "COD" ? "Tiền mặt" : m === "E_WALLET" ? "VNPay/QR" : "Thẻ";

// ─── Receipt Modal ──────────────────────────────────────────────────────────────
const ReceiptModal: React.FC<{
    invoice: Invoice;
    onClose: () => void;
    onPdf: () => void;
}> = ({ invoice, onClose, onPdf }) => {
    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    const ok = invoice.status === "COMPLETED";
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl my-4 overflow-hidden">
                <div className={`h-1.5 ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
                <div className="px-8 py-7">
                    <div className="text-center mb-6">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-200">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">
                            SecureShop POS
                        </h2>
                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-1">
                            Hóa đơn bán hàng
                        </p>
                        <span
                            className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${ok
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                                }`}
                        >
                            {ok ? "✓ Hoàn tất. Cảm ơn Qúy Khách" : "✕ Đã hủy"}
                        </span>
                    </div>
                    <hr className="border-dashed border-slate-200 my-5" />
                    <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                        {[
                            ["Mã hóa đơn", invoice.invoiceCode],
                            ["Nhân viên", invoice.staffName || "—"],
                            ["Ngày bán", fmtDate(invoice.createdAt)],
                            ["Phương thức", payLabel(invoice.paymentMethod)],
                        ].map(([l, v]) => (
                            <div key={l}>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                                    {l}
                                </p>
                                <p className="font-semibold text-slate-800 font-mono">{v}</p>
                            </div>
                        ))}
                    </div>
                    <hr className="border-slate-100 my-5" />
                    <div className="rounded-lg border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm block md:table">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-2 text-left w-1/2">Sản phẩm</th>
                                    <th className="px-2 py-2 text-center">SL</th>
                                    <th className="px-3 py-2 text-right">Đơn giá</th>
                                    <th className="px-4 py-2 text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((it, i) => (
                                    <tr
                                        key={it.id}
                                        className={`border-t border-slate-50 ${i % 2 ? "bg-slate-50/50" : ""
                                            }`}
                                    >
                                        <td className="px-4 py-2.5">
                                            <p className="font-medium text-slate-800 leading-tight">
                                                {it.productName}
                                            </p>
                                            {it.productSku && (
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                    SKU: {it.productSku}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-2 py-2.5 text-center text-slate-600 font-medium">
                                            {it.quantity}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-slate-600">
                                            {vnd(it.unitPrice)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                            {vnd(it.lineTotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-5 flex justify-end">
                        <div className="w-64 space-y-2 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Tổng sản phẩm</span>
                                <span className="font-medium text-slate-700">
                                    {vnd(invoice.totalAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>Vận chuyển</span>
                                <span className="text-emerald-600 font-bold">Miễn phí</span>
                            </div>
                            <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center">
                                <span className="font-black uppercase tracking-wide text-slate-900">
                                    Tổng tiền
                                </span>
                                <span className="font-black text-xl text-violet-600">
                                    {vnd(invoice.totalAmount)}
                                </span>
                            </div>
                            {invoice.paymentMethod === "COD" &&
                                invoice.cashReceived > 0 && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1.5 mt-2">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Khách đưa</span>
                                            <span className="font-semibold text-slate-800">
                                                {vnd(invoice.cashReceived)}
                                            </span>
                                        </div>
                                        <div className="border-t border-emerald-200/60 pt-1.5 flex justify-between text-emerald-700 font-black">
                                            <span>Tiền thừa</span>
                                            <span className="text-lg">
                                                {vnd(invoice.changeAmount)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                    <hr className="border-dashed border-slate-200 my-5" />
                    <p className="text-center text-sm text-slate-500 font-semibold">
                        Cảm ơn quý khách đã mua sắm! 🙏
                    </p>
                    <p className="text-center text-xs text-slate-400 mt-1">
                        SecureShop — Hotline: 1900-xxxx
                    </p>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onPdf}
                            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg font-bold text-sm text-white bg-gradient-to-br from-violet-600 to-cyan-500 hover:opacity-90 transition-opacity shadow-md"
                        >
                            <Download className="w-4 h-4" /> Tải PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 h-11 rounded-lg font-bold text-sm text-slate-600 border-2 border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Confirm Modal ──────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{
    title: string;
    msg: string;
    onOk: () => void;
    onCancel: () => void;
}> = ({ title, msg, onOk, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 mb-6">{msg}</p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 h-10 rounded-lg border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                    Giữ lại
                </button>
                <button
                    onClick={onOk}
                    className="flex-1 h-10 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 shadow-md shadow-red-200 transition-colors"
                >
                    Xác nhận xóa
                </button>
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN POS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const POS: React.FC = () => {
    // ── State ──────────────────────────────────────────────────────────────────
    const [cart, setCart] = useState<CartItem[]>([]);
    const [payMethod, setPayMethod] = useState<PayMethod>("COD");
    const [cashInput, setCashInput] = useState("");
    const [checking, setChecking] = useState(false);
    const [receipt, setReceipt] = useState<Invoice | null>(null);
    const [showCancel, setShowCancel] = useState(false);

    // Barcode
    const [barcode, setBarcode] = useState("");
    const [scanning, setScanning] = useState(false);
    const [scanMsg, setScanMsg] = useState<{ ok: boolean; text: string } | null>(
        null
    );
    const barcodeRef = useRef<HTMLInputElement>(null);
    const lastScanMs = useRef(0);

    // Categories
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");

    // Product panel
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [search, setSearch] = useState("");
    const [loadProd, setLoadProd] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // ── Load Categories ──────────────────────────────────────────────────────────
    useEffect(() => {
        categoryApi
            .getAll()
            .then((r) => setCategories(r))
            .catch(console.error);
    }, []);

    // ── Load products ──────────────────────────────────────────────────────────
    useEffect(() => {
        setLoadProd(true);
        const categoryId =
            activeCategoryId === "all" ? undefined : activeCategoryId;
        productApi
            .getAll({
                page: 0,
                size: 50,
                keyword: search || undefined,
                categoryId,
            })
            .then((r) => setProducts(r.content || []))
            .catch(() => setProducts([]))
            .finally(() => setLoadProd(false));
    }, [search, activeCategoryId]);

    // ── Focus barcode on mount ──────────────────────────────────────────────────
    useEffect(() => {
        barcodeRef.current?.focus();
    }, []);

    // ── Flash scan message ──────────────────────────────────────────────────────
    const flash = (ok: boolean, text: string) => {
        setScanMsg({ ok, text });
        setTimeout(() => setScanMsg(null), 2500);
    };

    // ── Add to cart ─────────────────────────────────────────────────────────────
    const addToCart = useCallback((product: ProductSummary, qty = 1) => {
        setCart((prev) => {
            const stock = product.availableStock ?? 9999;
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                if (existing.quantity + qty > stock) {
                    flash(false, `Kho chỉ còn ${stock} sản phẩm`);
                    return prev;
                }
                return prev.map((i) =>
                    i.product.id === product.id
                        ? { ...i, quantity: i.quantity + qty }
                        : i
                );
            }
            if (qty > stock) {
                flash(false, `Kho chỉ còn ${stock} sản phẩm`);
                return prev;
            }
            return [{ product, quantity: qty }, ...prev];
        });
    }, []);

    // ── Barcode scan ────────────────────────────────────────────────────────────
    const handleScan = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const code = barcode.trim();
        if (!code) return;
        const now = Date.now();
        if (now - lastScanMs.current < 200) {
            setBarcode("");
            return;
        }
        lastScanMs.current = now;
        setScanning(true);
        try {
            const res = await posApi.scanBarcode(code);
            addToCart(res.product);
            flash(true, `✓ Đã thêm ${res.product.name}`);
        } catch {
            flash(false, "Không tìm thấy mã vạch này");
        } finally {
            setBarcode("");
            setScanning(false);
            barcodeRef.current?.focus();
        }
    };

    // ── Cart ops ────────────────────────────────────────────────────────────────
    const changeQty = (id: string, delta: number) =>
        setCart((prev) =>
            prev
                .map((i) =>
                    i.product.id === id ? { ...i, quantity: i.quantity + delta } : i
                )
                .filter((i) => i.quantity > 0)
        );

    const removeItem = (id: string) =>
        setCart((prev) => prev.filter((i) => i.product.id !== id));

    const clearCart = () => {
        setCart([]);
        setCashInput("");
        setShowCancel(false);
        barcodeRef.current?.focus();
    };

    // ── Totals ──────────────────────────────────────────────────────────────────
    const totalPrice = cart.reduce(
        (s, i) => s + i.product.price * i.quantity,
        0
    );
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
    const cashNum = parseFloat(cashInput.replace(/[^0-9]/g, "")) || 0;
    const change = Math.max(0, cashNum - totalPrice);
    const cashOk = payMethod !== "COD" || cashNum >= totalPrice;

    // ── Checkout ─────────────────────────────────────────────────────────────────
    const handleCheckout = async () => {
        if (!cart.length || checking || !cashOk) return;
        setChecking(true);
        try {
            const inv: Invoice = await posApi.checkout({
                items: cart.map((i) => ({
                    productId: i.product.id,
                    quantity: i.quantity,
                })),
                paymentMethod: payMethod,
                cashReceived: payMethod === "COD" ? cashNum : totalPrice,
            });
            setCart([]);
            setCashInput("");
            setReceipt(inv);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response
                    ?.data?.message ?? "Lỗi thanh toán. Vui lòng thử lại.";
            flash(false, msg);
        } finally {
            setChecking(false);
        }
    };

    // ── Keyboard shortcuts ──────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "F2") {
                e.preventDefault();
                handleCheckout();
            }
            if (e.key === "F4") {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key === "Escape" && !receipt) {
                e.preventDefault();
                if (cart.length) setShowCancel(true);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, checking, cashOk, receipt]);

    // ── Quick cash amounts ───────────────────────────────────────────────────────
    const quickCash =
        totalPrice > 0
            ? [10000, 50000, 100000, 500000]
                .map((step) => Math.ceil(totalPrice / step) * step)
                .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                .slice(0, 4)
            : [];

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────────
    return (
        <div className="font-sans antialiased text-slate-900 bg-slate-50 h-[calc(100vh-56px)] flex flex-col overflow-hidden">
            {/* ── Modals ─── */}
            {receipt && (
                <ReceiptModal
                    invoice={receipt}
                    onClose={() => {
                        setReceipt(null);
                        barcodeRef.current?.focus();
                    }}
                    onPdf={() => invoiceApi.downloadPdf(receipt.id, receipt.invoiceCode)}
                />
            )}
            {showCancel && (
                <ConfirmModal
                    title="Xóa toàn bộ giỏ hàng?"
                    msg="Tất cả sản phẩm trong giỏ sẽ bị xóa. Không thể hoàn tác."
                    onOk={clearCart}
                    onCancel={() => setShowCancel(false)}
                />
            )}

            {/* ════════════════════════════════════════════════════════════════
          POS 3-COLUMN GRID LAYOUT
      ════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 min-h-0 p-5 box-border grid grid-cols-[260px_1fr_380px] gap-5">

                {/* ══════════════════════════════════════════════════
            LEFT — SIDEBAR CATEGORY MENU
        ══════════════════════════════════════════════════ */}
                <div className="bg-white border border-slate-200 rounded-[12px] flex flex-col overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-200">
                        <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                            <LayoutGrid size={20} className="text-violet-600" /> Danh mục SP
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-col gap-2">
                            {/* All Categories Option */}
                            <button
                                onClick={() => setActiveCategoryId("all")}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer border-none text-left transition-all duration-200 ${activeCategoryId === "all"
                                    ? "bg-violet-50 text-violet-700 font-semibold"
                                    : "bg-transparent text-slate-600 font-medium hover:bg-slate-100"
                                    }`}
                            >
                                <span className="text-[14px]">Tất cả sản phẩm</span>
                                {activeCategoryId === "all" && <ChevronRight size={16} />}
                            </button>

                            {/* Dynamic Categories */}
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategoryId(cat.id)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer border-none text-left transition-all duration-200 ${activeCategoryId === cat.id
                                        ? "bg-violet-50 text-violet-700 font-semibold"
                                        : "bg-transparent text-slate-600 font-medium hover:bg-slate-100"
                                        }`}
                                >
                                    <span className="text-[14px]">{cat.name}</span>
                                    {activeCategoryId === cat.id && <ChevronRight size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════
            CENTER — PRODUCT GRID & SEARCH
        ══════════════════════════════════════════════════ */}
                <div className="flex flex-col gap-5 overflow-hidden">
                    {/* Top Bar: Search & Barcode */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Search Input */}
                        <div className="relative bg-white rounded-xl border border-slate-200 flex items-center px-4 shadow-sm focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                            <Search size={18} className="text-slate-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Tìm kiếm sản phẩm (F4)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none py-3.5 px-3 text-[14px] text-slate-900 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Barcode Scanner */}
                        <form
                            onSubmit={handleScan}
                            className={`relative bg-white rounded-xl border flex items-center px-4 shadow-sm transition-all focus-within:ring-2 focus-within:ring-opacity-50 ${scanMsg
                                ? scanMsg.ok
                                    ? "border-emerald-500 focus-within:ring-emerald-100"
                                    : "border-red-500 focus-within:ring-red-100"
                                : "border-slate-200 focus-within:border-violet-400 focus-within:ring-violet-100"
                                }`}
                        >
                            <ScanLine size={18} className="text-violet-600" />
                            <input
                                ref={barcodeRef}
                                type="text"
                                placeholder="Quét mã vạch sản phẩm..."
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                disabled={scanning}
                                className="flex-1 bg-transparent border-none outline-none py-3.5 px-3 text-[14px] text-slate-900 font-mono placeholder:text-slate-400 placeholder:font-sans"
                            />
                            {scanMsg && (
                                <span
                                    className={`absolute right-4 text-[13px] font-semibold animate-in zoom-in duration-200 ${scanMsg.ok ? "text-emerald-500" : "text-red-500"
                                        }`}
                                >
                                    {scanMsg.text}
                                </span>
                            )}
                        </form>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto pb-6 pr-1">
                        {loadProd ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-[240px] rounded-xl bg-slate-200 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Package2 size={48} className="text-slate-300 mb-4" />
                                <p className="text-[16px] text-slate-500 font-medium">
                                    Không tìm thấy sản phẩm nào
                                </p>
                                <p className="text-[14px] text-slate-400 mt-1">
                                    Hãy thử từ khóa khác hoặc dọn bộ lọc
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
                                {products.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            addToCart(p);
                                            flash(true, `✓ Thêm 1 ${p.name}`);
                                        }}
                                        className="group bg-white border border-slate-200 rounded-xl p-0 cursor-pointer text-left overflow-hidden flex flex-col transition-all duration-200 hover:border-violet-500 hover:shadow-[0_8px_16px_-4px_rgba(124,58,237,0.15)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-50"
                                    >
                                        <div className="w-full h-[150px] bg-slate-50 overflow-hidden relative">
                                            <img
                                                src={p.thumbnailUrl || "/placeholder.png"}
                                                alt={p.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {(!p.availableStock || p.availableStock === 0) && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md">
                                                        HẾT HÀNG
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex flex-col flex-1">
                                            <p className="text-[14px] font-medium text-slate-800 leading-snug mb-2 line-clamp-2">
                                                {p.name}
                                            </p>
                                            <div className="mt-auto flex justify-between items-center">
                                                <p className="text-[16px] font-bold text-violet-600">
                                                    {vnd(p.price)}
                                                </p>
                                                <span className="text-[12px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                                    Kho: {p.availableStock || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════
            RIGHT — CART & CHECKOUT
        ══════════════════════════════════════════════════ */}
                <div className="bg-white border border-slate-200 rounded-[12px] flex flex-col overflow-hidden shadow-sm">
                    {/* Cart Header */}
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                                <ShoppingCart size={18} />
                            </div>
                            <span className="text-[18px] font-semibold text-slate-900">
                                Giỏ hàng
                            </span>
                            {totalQty > 0 && (
                                <span className="bg-violet-600 text-white text-[13px] font-bold px-2.5 py-0.5 rounded-full ml-1">
                                    {totalQty}
                                </span>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setShowCancel(true)}
                                className="flex items-center gap-1.5 text-[13px] text-red-500 bg-red-50 border-none rounded-lg px-3 py-1.5 cursor-pointer font-medium transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                            >
                                <Trash2 size={14} /> Xóa trống
                            </button>
                        )}
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingCart size={40} className="text-slate-300" />
                                </div>
                                <p className="text-[15px] text-slate-500 font-medium">
                                    Chưa có sản phẩm nào
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {cart.map((item) => (
                                    <div
                                        key={item.product.id}
                                        className="flex gap-3.5 p-3 border border-slate-200 rounded-xl bg-white transition-colors hover:border-slate-300 group"
                                    >
                                        <img
                                            src={item.product.thumbnailUrl || "/placeholder.png"}
                                            alt={item.product.name}
                                            className="w-14 h-14 rounded-lg object-cover border border-slate-100"
                                        />
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="text-[14px] font-medium text-slate-800 leading-snug line-clamp-2">
                                                    {item.product.name}
                                                </p>
                                                <button
                                                    onClick={() => removeItem(item.product.id)}
                                                    className="border-none text-slate-400 bg-transparent hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md cursor-pointer transition-colors -mr-1 -mt-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Xóa sản phẩm này"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                                    <button
                                                        onClick={() => changeQty(item.product.id, -1)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-md border-none text-slate-600 bg-transparent cursor-pointer hover:bg-white hover:text-slate-900 transition-colors hover:shadow-sm"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-[13px] font-semibold text-slate-900 w-7 text-center select-none font-mono">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => changeQty(item.product.id, 1)}
                                                        disabled={
                                                            item.quantity >=
                                                            (item.product.availableStock ?? 9999)
                                                        }
                                                        className={`w-7 h-7 flex items-center justify-center rounded-md border-none bg-transparent cursor-pointer transition-colors ${item.quantity >=
                                                            (item.product.availableStock ?? 9999)
                                                            ? "text-slate-300 cursor-not-allowed"
                                                            : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                                                            }`}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-[14px] font-bold text-slate-900">
                                                    {vnd(item.product.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Checkout Section at Bottom Right */}
                    <div className="bg-white border-t border-slate-200 p-5 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
                        {/* Summary */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[15px] font-medium text-slate-500">
                                Tổng số lượng:
                            </span>
                            <span className="text-[15px] font-bold text-slate-900">
                                {totalQty} sản phẩm
                            </span>
                        </div>
                        <div className="flex justify-between items-end mb-5">
                            <span className="text-[16px] font-semibold text-slate-800 pb-1">
                                Khách Phải Trả
                            </span>
                            <span className="text-[28px] font-extrabold text-violet-600 tracking-tight leading-none">
                                {vnd(totalPrice)}
                            </span>
                        </div>

                        {/* Payment Method Bubbles */}
                        <div className="flex gap-2 mb-4">
                            {[
                                { v: "COD", label: "Tiền mặt", Icon: Banknote },
                                { v: "CARD", label: "Quẹt Thẻ", Icon: CreditCard },
                                { v: "E_WALLET", label: "Mã QR", Icon: QrCode },
                            ].map(({ v, label, Icon }) => {
                                const active = payMethod === v;
                                return (
                                    <button
                                        key={v}
                                        onClick={() => setPayMethod(v as PayMethod)}
                                        className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-300 ${active
                                            ? "border-violet-600 bg-violet-50 text-violet-700 font-bold shadow-sm"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:bg-slate-50 font-medium"
                                            }`}
                                    >
                                        <Icon size={22} className={active ? "text-violet-600" : "text-slate-400"} />
                                        <span className="text-[12px]">{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Cash Input if COD */}
                        {payMethod === "COD" && (
                            <div className="mb-5 animate-in slide-in-from-top-2 duration-200">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium z-10">
                                        Khách đưa:
                                    </span>
                                    <input
                                        type="text"
                                        value={cashInput}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9]/g, "");
                                            setCashInput(
                                                raw ? parseInt(raw).toLocaleString("vi-VN") : ""
                                            );
                                        }}
                                        className={`w-full box-border pt-3.5 pb-3.5 pl-24 pr-4 text-[16px] font-bold text-right border rounded-xl outline-none bg-white transition-colors focus:ring-2 ${cashInput && !cashOk
                                            ? "border-red-400 focus:ring-red-100 text-red-600"
                                            : "border-slate-300 focus:border-violet-500 focus:ring-violet-100 text-slate-900"
                                            }`}
                                        placeholder="0 ₫"
                                    />
                                    {cashInput && (
                                        <div
                                            className={`absolute top-[48px] right-2 text-[13px] font-bold px-3 py-1 rounded-b-md ${cashOk ? "text-emerald-600" : "text-red-600"
                                                }`}
                                        >
                                            {cashOk
                                                ? `Trổ lại: ${vnd(change)}`
                                                : `Thiếu: ${vnd(totalPrice - cashNum)}`}
                                        </div>
                                    )}
                                </div>
                                {quickCash.length > 0 && (
                                    <div className="flex gap-2 mt-3 pt-4">
                                        {quickCash.map((v) => (
                                            <button
                                                key={v}
                                                onClick={() => setCashInput(v.toLocaleString("vi-VN"))}
                                                className="flex-1 py-1.5 text-[13px] font-semibold border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 transition-colors focus:outline-none"
                                            >
                                                {v >= 1000000 ? `${v / 1000000}M` : `${v / 1000}k`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Big Pay Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={!cart.length || checking || !cashOk}
                            className={`w-full h-[52px] rounded-xl border-none text-[16px] font-bold flex items-center justify-center gap-2 transition-all duration-300 outline-none ${!cart.length || checking || !cashOk
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-violet-600 to-cyan-500 text-white cursor-pointer hover:opacity-95 hover:shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] active:scale-[0.98] focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                }`}
                        >
                            {checking ? (
                                <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    THANH TOÁN <span className="text-[12px] font-medium opacity-80 font-mono bg-white/20 px-1.5 py-0.5 rounded ml-1">(F2)</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POS;
