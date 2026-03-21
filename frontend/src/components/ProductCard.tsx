import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import type { ProductSummary } from '../types/types';

interface ProductCardProps {
  product: ProductSummary;
  onAddToCart?: (product: ProductSummary) => Promise<void> | void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.inStock) {
      toast.warning('Sản phẩm hiện đã hết hàng!');
      return;
    }

    if (product.availableStock !== undefined && product.availableStock <= 0) {
      toast.warning('Sản phẩm tạm hết trong kho!');
      return;
    }

    if (!onAddToCart) {
      toast.error('Không thể thêm sản phẩm — chưa có handler.');
      return;
    }

    try {
      setIsAdding(true);
      await onAddToCart(product);
    } finally {
      setIsAdding(false);
    }
  };

  const hasDiscount = product.listedPrice && product.listedPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.listedPrice - product.price) / product.listedPrice) * 100)
    : 0;

  const isHot = (product.sales || 0) > 50;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col group relative overflow-hidden w-full h-full border border-gray-100"
    >
      {/* Product Image Link */}
      <Link to={`/products/${product.id}`} className="block relative">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
          {isHot && (
            <span className="bg-[#ee4d2d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
              Bán chạy
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-[#fce028] text-[#ee4d2d] text-xs font-bold px-1.5 py-0.5 rounded-sm shadow-sm flex items-center justify-center">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Instock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <span className="text-white bg-black/60 px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm shadow-sm">
              Hết hàng
            </span>
          </div>
        )}

        {/* Image 1:1 Aspect Ratio container */}
        <div className="w-full aspect-square overflow-hidden flex items-center justify-center">
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="p-2 sm:p-3 flex flex-col flex-1 relative">
        {/* Product Name */}
        <Link to={`/products/${product.id}`} className="block mt-1 mb-1.5">
          <h3 className="text-[13px] sm:text-sm text-gray-800 leading-relaxed font-medium line-clamp-2 min-h-[36px] sm:min-h-[40px] group-hover:text-purple-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto"></div>

        {/* Rating and Sales */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500 mb-2">
          <div className="flex items-center text-yellow-400">
            <Star className="w-[10px] h-[10px] sm:w-3 sm:h-3 fill-current" />
            <span className="ml-[2px] text-gray-700 font-medium">
              {product.rating ? parseFloat(product.rating.toFixed(1)) : 0}
            </span>
          </div>
          {(product.sales !== undefined && product.sales >= 0) && (
            <span className="line-clamp-1">
              Đã bán {product.sales > 1000 ? `${(product.sales / 1000).toFixed(1)}k` : product.sales}
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="text-sm sm:text-base font-semibold text-[#ee4d2d]">
              {formatPrice(product.price)}
            </span>
          </div>
          <div className="h-[18px]">
            {hasDiscount && (
              <span className="text-[11px] sm:text-xs text-gray-400 line-through">
                {formatPrice(product.listedPrice)}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Quick Add To Cart Button */}
      {product.inStock && (
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center opacity-100 sm:opacity-0 sm:-translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 shadow-sm hover:bg-purple-600 hover:text-white transition-all duration-300 z-10"
          aria-label="Thêm vào giỏ hàng"
          title="Thêm vào giỏ hàng"
        >
          {isAdding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShoppingCart className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </motion.div>
  );
};

export default ProductCard;