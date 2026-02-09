import React from 'react';
import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import FeaturedProducts from '../components/FeaturedProducts';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />

        {/* Why Choose Us Section */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-zinc-800 mb-4">Tại Sao Chọn Security Shop?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Chúng tôi cam kết mang đến những giải pháp an ninh tốt nhất với chất lượng và dịch vụ hàng đầu
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-800 mb-3">Chất Lượng Đảm Bảo</h3>
                <p className="text-gray-600">
                  Tất cả sản phẩm đều được kiểm tra chất lượng nghiêm ngặt và có bảo hành chính hãng
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-800 mb-3">Giao Hàng Nhanh</h3>
                <p className="text-gray-600">
                  Giao hàng toàn quốc trong 24-48h, lắp đặt và hướng dẫn sử dụng miễn phí
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-800 mb-3">Hỗ Trợ 24/7</h3>
                <p className="text-gray-600">
                  Đội ngũ kỹ thuật viên chuyên nghiệp sẵn sàng hỗ trợ bạn mọi lúc mọi nơi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-gradient-to-r from-purple-600 to-cyan-500 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Sẵn Sàng Bảo Vệ Ngôi Nhà Của Bạn?</h2>
            <p className="text-xl mb-8 opacity-90">
              Liên hệ ngay với chúng tôi để được tư vấn miễn phí về giải pháp an ninh phù hợp nhất
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Tư Vấn Miễn Phí
              </Link>
              <Link
                to="tel:0123456789"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
              >
                Gọi Ngay: 0123 456 789
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;