import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link, useLocation } from "react-router-dom";
import { productApi, PaymentApi } from "../utils/api";
import { toast } from "react-toastify";
import type { ProductSummary } from "../types/types";
import ProductCard from "../components/ProductCard";
import { cartService } from "../utils/cartService";

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<ProductSummary[]>([]);

  // Fetch sản phẩm từ API thật
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProducts = async () => {
      try {
        const response = await productApi.getAll({ page: 0, size: 6, sort: "rating,desc", inStock: true });
        setProducts(response.content);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm gợi ý:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (product: ProductSummary) => {
    const success = await cartService.addToCart(product);
    if (success) window.dispatchEvent(new Event("cartUpdated"));
  };

  // === Tính thời gian giao hàng ===
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3); // Ngày dự kiến giao
  const displayDate = new Date(deliveryDate);
  displayDate.setDate(deliveryDate.getDate() - 1); // Hiển thị sớm hơn 1 ngày

  const formattedDate = displayDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Thông báo thành công */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-md text-center p-10"
        >
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-zinc-800 mb-3">
            Đặt hàng thành công 🎉
          </h1>
          <p className="text-gray-600 mb-2">
            Cảm ơn bạn đã tin tưởng <span className="text-blue-600 font-semibold">Security Store</span>.
          </p>
          <p className="text-gray-700 mb-6">
            Dự kiến giao hàng vào:{" "}
            <span className="font-semibold text-green-600">{formattedDate}</span>
          </p>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Tiếp tục mua hàng
          </Link>


        </motion.div>

        {/* Sản phẩm tương tự */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-zinc-800 text-center mb-8">
            Có thể bạn sẽ thích 💡
          </h2>

          {products.length === 0 ? (
            <p className="text-center text-gray-500">Đang tải sản phẩm...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <ProductCard product={product} onAddToCart={() => handleAddToCart(product)} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div >
  );
};

export default OrderSuccess;
