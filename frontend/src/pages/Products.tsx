import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import {
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cartService } from "../utils/cartService";
import type { Brand, CategorySummary, ProductSummary } from "../types/types";
import { brandApi, categoryApi, productApi } from "../utils/api";
import type { ProductQueryParams } from "../types/query";
import Pagination from "../components/Pagination";
import SkeletonCard from "../components/SkeletonCard";

const Products: React.FC = () => {
  const { state } = useLocation();
  const { keyword } = state || {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();

  // === States ===
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(keyword || "");
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const param = searchParams.get("category");
    return param ? parseInt(param) : 0;
  });
  const [selectedBrand, setSelectedBrand] = useState<number>(() => {
    const param = searchParams.get("brand");
    return param ? parseInt(param) : 0;
  });
  const [sortBy, setSortBy] = useState("name");
  const [viewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // === Price filter states ===
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [tempMinPrice, setTempMinPrice] = useState<string>("");
  const [tempMaxPrice, setTempMaxPrice] = useState<string>("");

  // === Stock filter state ===
  const [stockFilter, setStockFilter] = useState<
    "all" | "inStock" | "outOfStock"
  >("inStock");

  // === Show all categories/brands ===
  const [showAllCategories, setShowAllCategories] = useState(false);

  // === Pagination ===
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // === Fetch products ===
  const fetchProducts = useCallback(
    async (filters: ProductQueryParams = {}, signal?: AbortSignal) => {
      try {
        setLoading(true);

        let inStock: boolean | undefined = undefined;
        if (filters.stockFilter === "inStock") inStock = true;
        else if (filters.stockFilter === "outOfStock") inStock = false;

        const response = await productApi.getAll({
          active: filters.active ?? true,
          categoryId: filters.categoryId || undefined,
          brandId: filters.brandId || undefined,
          keyword: filters.keyword,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          inStock,
          page: filters.page ?? 0,
          size: filters.size ?? pageSize,
          sort: filters.sort ?? "name,asc",
        });

        if (signal?.aborted) return;

        setProducts(response.content);
        setTotalPages(response.page.totalPages);
        setTotalElements(response.page.totalElements);
      } catch (error: any) {
        if (error.name === "AbortError" || error.name === "CanceledError")
          return;
        setProducts([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [pageSize]
  );

  const fetchFilters = async () => {
    return Promise.all([categoryApi.getAll(), brandApi.getAll()]);
  };

  useEffect(() => {
    fetchFilters()
      .then(([categoriesRes, brandsRes]) => {
        setCategories([
          { id: 0, name: "Tất cả" } as CategorySummary,
          ...categoriesRes,
        ]);
        setBrands([{ id: 0, name: "Tất cả" }, ...(brandsRes?.content ?? [])]);
      })
      .catch(() => { })
      .finally(() => setLoadingFilters(false));
  }, []);

  // === Load products (debounce + abort) ===
  useEffect(() => {
    // Đợi filters load xong
    if (loadingFilters) return;

    const abortController = new AbortController();

    const timer = setTimeout(
      () => {
        const params: any = {
          page,
          stockFilter: stockFilter || "all",
        };

        // Chỉ thêm minPrice/maxPrice nếu có giá trị
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        if (selectedCategory && selectedCategory !== 0)
          params.categoryId = selectedCategory;
        if (selectedBrand && selectedBrand !== 0)
          params.brandId = selectedBrand;
        if (searchTerm.trim()) params.keyword = searchTerm.trim();

        switch (sortBy) {
          case "price-low":
            params.sort = "price,asc";
            break;
          case "price-high":
            params.sort = "price,desc";
            break;
          case "rating":
            params.sort = "rating,desc";
            break;
          default:
            params.sort = "name,asc";
        }

        fetchProducts(params, abortController.signal);
      },
      150 // Reduced delay to 150ms to make it feel real-time
    );

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [
    loadingFilters,
    selectedCategory,
    selectedBrand,
    searchTerm,
    sortBy,
    page,
    minPrice,
    maxPrice,
    stockFilter,
    fetchProducts,
    keyword,
  ]);

  // === Handle filter actions ===
  const handleApplyPriceFilter = () => {
    if (tempMinPrice && tempMaxPrice) {
      const min = parseFloat(tempMinPrice);
      const max = parseFloat(tempMaxPrice);
      if (min > max) return alert("Giá tối thiểu không thể lớn hơn giá tối đa");
    }
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setPage(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetPriceFilter = () => {
    setMinPrice("");
    setMaxPrice("");
    setTempMinPrice("");
    setTempMaxPrice("");
    setPage(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStockFilterChange = (
    filter: "all" | "inStock" | "outOfStock"
  ) => {
    setStockFilter(filter);
    setPage(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (category: number) => {
    setSelectedCategory(category);
    setPage(0);
    if (category === 0) searchParams.delete("category");
    else searchParams.set("category", category.toString());
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBrandChange = (brand: number) => {
    setSelectedBrand(brand);
    setPage(0);
    if (brand === 0) searchParams.delete("brand");
    else searchParams.set("brand", brand.toString());
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = async (product: ProductSummary) => {
    const success = await cartService.addToCart(product);
    if (success) window.dispatchEvent(new Event("cartUpdated"));
  };

  const displayedCategories = showAllCategories
    ? categories
    : categories.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <div className="w-full bg-[#f5f5f5]">
        <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 py-4 sm:py-6">
          {/* Top Categories / Brands Scrollable Bar */}
          <div className="bg-white rounded-[2px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-4 mb-4 hidden lg:block border border-gray-100">
            <div className="flex items-start text-gray-700 text-[14px]">
              <span className="w-[120px] shrink-0 font-semibold mt-1">Thương hiệu</span>
              <div className="flex flex-wrap gap-2 flex-1">
                <button
                  onClick={() => handleBrandChange(0)}
                  className={`px-4 py-1 rounded-[2px] text-[13px] border transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] ${selectedBrand === 0
                    ? "bg-[#ee4d2d] text-white border-[#ee4d2d] font-medium"
                    : "bg-white border-transparent hover:border-[#ee4d2d] text-gray-700 hover:text-[#ee4d2d]"
                    }`}
                >
                  Tất cả
                </button>
                {brands.filter(b => b.id !== 0).map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => handleBrandChange(brand.id)}
                    className={`px-4 py-1 rounded-[2px] text-[13px] border transition-colors shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] ${selectedBrand === brand.id
                      ? "bg-[#ee4d2d] text-white border-[#ee4d2d] font-medium"
                      : "bg-white border-transparent hover:border-[#ee4d2d] text-gray-700 hover:text-[#ee4d2d]"
                      }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters with Scrollbar */}
            <aside
              className={`w-full lg:w-[220px] shrink-0 ${showFilters ? "block" : "hidden lg:block"
                }`}
            >
              <div className="bg-white rounded-[2px] border border-gray-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] sticky top-[72px] max-h-[calc(100vh-80px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <div className="p-4 space-y-5">
                  {/* Category filter */}
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-800 mb-3 flex items-center gap-2 sticky top-0 bg-white pb-2 z-10 border-b border-gray-100">
                      Danh mục
                      {loadingFilters && (
                        <span className="h-3 w-3 rounded-full bg-[#ee4d2d] animate-pulse" />
                      )}
                    </h3>

                    <div className="space-y-2">
                      {loadingFilters ? (
                        [...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-8 w-full bg-gray-100 rounded-lg animate-pulse"
                          />
                        ))
                      ) : (
                        <>
                          {displayedCategories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => handleCategoryChange(category.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${selectedCategory === category.id
                                ? "text-[#ee4d2d] font-medium bg-red-50"
                                : "text-gray-600 hover:text-[#ee4d2d]"
                                }`}
                            >
                              {category.name}
                            </button>
                          ))}
                          {categories.length > 6 && (
                            <button
                              onClick={() =>
                                setShowAllCategories(!showAllCategories)
                              }
                              className="w-full text-left px-3 py-2 text-[#ee4d2d] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm"
                            >
                              {showAllCategories ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Thu gọn
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  Xem tất cả ({categories.length - 6} danh mục)
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price filter */}
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-800 mb-3 sticky top-0 bg-white pb-2 z-10 border-b border-gray-100">
                      Khoảng giá
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Giá tối thiểu (₫)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={tempMinPrice}
                          onChange={(e) => setTempMinPrice(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-[2px] focus:ring-1 focus:ring-[#ee4d2d] focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Giá tối đa (₫)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={tempMaxPrice}
                          onChange={(e) => setTempMaxPrice(e.target.value)}
                          placeholder="Không giới hạn"
                          className="w-full px-3 py-2 border border-gray-300 rounded-[2px] focus:ring-1 focus:ring-[#ee4d2d] focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApplyPriceFilter}
                          className="flex-1 px-3 sm:px-4 py-2 bg-[#ee4d2d] text-white rounded-[2px] shadow-sm hover:bg-[#d74325] transition-colors text-sm"
                        >
                          Áp dụng
                        </button>
                        <button
                          onClick={handleResetPriceFilter}
                          className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-600 rounded-[2px] hover:bg-gray-50 transition-colors text-sm shadow-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stock filter */}
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-800 mb-3 sticky top-0 bg-white pb-2 z-10 border-b border-gray-100">
                      Tình trạng
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleStockFilterChange("all")}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${stockFilter === "all"
                          ? "text-[#ee4d2d] font-medium bg-red-50"
                          : "text-gray-600 hover:text-[#ee4d2d]"
                          }`}
                      >
                        Tất cả
                      </button>
                      <button
                        onClick={() => handleStockFilterChange("inStock")}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${stockFilter === "inStock"
                          ? "text-[#ee4d2d] font-medium bg-red-50"
                          : "text-gray-600 hover:text-[#ee4d2d]"
                          }`}
                      >
                        Còn hàng
                      </button>
                      <button
                        onClick={() => handleStockFilterChange("outOfStock")}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${stockFilter === "outOfStock"
                          ? "text-[#ee4d2d] font-medium bg-red-50"
                          : "text-gray-600 hover:text-[#ee4d2d]"
                          }`}
                      >
                        Hết hàng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3"
                  >
                    {[...Array(10)].map((_, index) => (
                      <SkeletonCard key={index} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`${selectedCategory}-${page}-${sortBy}-${searchTerm}-${minPrice}-${maxPrice}-${stockFilter}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {/* Filter and Sort Bar */}
                    <div className="sticky top-16 z-40 bg-[#ededed] shadow-sm rounded-[2px] p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm transition-all duration-300">
                      <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-1 sm:pb-0">
                        <span className="text-gray-600 whitespace-nowrap hidden sm:inline">Sắp xếp theo</span>
                        <button
                          onClick={() => { setSortBy("name"); setPage(0); }}
                          className={`px-4 py-2 rounded-[2px] whitespace-nowrap shadow-sm ${sortBy === "name" ? "bg-[#ee4d2d] text-white" : "bg-white text-gray-800 hover:bg-gray-50"}`}
                        >
                          Phổ biến
                        </button>
                        <button
                          onClick={() => { setSortBy("rating"); setPage(0); }}
                          className={`px-4 py-2 rounded-[2px] whitespace-nowrap shadow-sm ${sortBy === "rating" ? "bg-[#ee4d2d] text-white" : "bg-white text-gray-800 hover:bg-gray-50"}`}
                        >
                          Đánh giá cao
                        </button>

                        <div className="relative group min-w-[150px] shadow-sm">
                          <select
                            value={sortBy.startsWith("price") ? sortBy : ""}
                            onChange={(e) => {
                              if (e.target.value) { setSortBy(e.target.value); setPage(0); }
                            }}
                            className={`w-full px-4 py-2 rounded-[2px] appearance-none cursor-pointer outline-none ${sortBy.startsWith("price") ? "bg-[#ee4d2d] text-white" : "bg-white text-gray-800"}`}
                          >
                            <option value="" disabled className="text-gray-800 bg-white">Giá</option>
                            <option value="price-low" className="text-gray-800 bg-white">Giá: Thấp đến Cao</option>
                            <option value="price-high" className="text-gray-800 bg-white">Giá: Cao đến Thấp</option>
                          </select>
                          <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${sortBy.startsWith("price") ? "text-white" : "text-gray-500"}`}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Search box and Mobile Filter Toggle */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-56 shadow-sm">
                          <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setPage(0);
                            }}
                            className="w-full pl-8 pr-3 py-2 border-none rounded-[2px] focus:ring-1 focus:ring-[#ee4d2d] outline-none text-[13px]"
                          />
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className="lg:hidden flex items-center justify-center p-2 bg-white rounded-[2px] shadow-sm text-gray-700"
                        >
                          <Filter className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {products.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                          Không tìm thấy sản phẩm nào
                        </p>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`grid gap-2 sm:gap-3 ${viewMode === "grid"
                            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                            : "grid-cols-1"
                            }`}
                        >
                          {products.map((product, index) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <ProductCard
                                product={product}
                                onAddToCart={handleAddToCart}
                              />
                            </motion.div>
                          ))}
                        </div>

                        <Pagination
                          page={page}
                          totalPages={totalPages}
                          totalElements={totalElements}
                          pageSize={pageSize}
                          onPageChange={(newPage) => {
                            setPage(newPage);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(0);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Products;
