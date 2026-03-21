import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Facebook, Instagram, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { SupportTicketApi } from '../utils/api';
import { useAppSelector } from '../hooks';

const Contact: React.FC = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    subject: '',
    message: ''
  });

  // Auto-fill user info if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Địa chỉ',
      content: 'Tòa nhà FPT Polytechnic, Phố Trịnh Văn Bô, Xuân Phương, Nam Từ Liêm, Hà Nội',
      link: 'https://maps.app.goo.gl/KeS7v7y5Fk3Yw7z67'
    },
    {
      icon: Phone,
      title: 'Điện thoại',
      content: '0123 456 789',
      link: 'tel:0123456789'
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'contact@securityshop.vn',
      link: 'mailto:contact@securityshop.vn'
    },
    {
      icon: Clock,
      title: 'Giờ làm việc',
      content: 'T2 - T7: 8:00 - 18:00',
      link: null
    }
  ];

  const branches = [
    {
      city: 'TP. Hồ Chí Minh',
      address: 'Số 4 Nguyễn Văn Bảo, Quận Gò Vấp',
      phone: '0123 456 789',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      city: 'Hà Nội',
      address: '456 Đường Láng, Quận Đống Đa',
      phone: '0123 456 790',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      city: 'Đà Nẵng',
      address: '789 Đường Trần Phú, Quận Hải Châu',
      phone: '0123 456 791',
      image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    }
  ];

  const faqs = [
    {
      question: 'Sản phẩm có được bảo hành không?',
      answer: 'Tất cả sản phẩm của chúng tôi đều được bảo hành chính hãng từ 12-24 tháng tùy theo loại sản phẩm.'
    },
    {
      question: 'Có hỗ trợ lắp đặt miễn phí không?',
      answer: 'Chúng tôi hỗ trợ lắp đặt miễn phí cho đơn hàng trên 5 triệu đồng trong nội thành.'
    },
    {
      question: 'Thời gian giao hàng là bao lâu?',
      answer: 'Đơn hàng trong nội thành sẽ được giao trong 24h, ngoại thành và tỉnh từ 2-3 ngày.'
    },
    {
      question: 'Có chính sách đổi trả không?',
      answer: 'Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày nếu sản phẩm có lỗi từ nhà sản xuất.'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.email || !formData.message || !formData.title || !formData.subject) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    if (!user) {
      toast.info('Vui lòng đăng nhập để gửi yêu cầu hỗ trợ! Chúng tôi cần tài khoản để theo dõi xử lý yêu cầu của bạn.');
      return;
    }

    setIsSubmitting(true);

    try {
      await SupportTicketApi.createTicket({
        title: formData.title,
        subject: formData.subject,
        content: formData.message
      });

      toast.success('Gửi yêu cầu hỗ trợ thành công! Chúng tôi sẽ phản hồi sớm nhất.');

      // Reset form but keep user info
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        title: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error(error);
      toast.error('Gửi yêu cầu thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Section */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-r from-purple-600 to-cyan-500 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white opacity-10 rounded-full mix-blend-overlay filter blur-3xl transform -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-300 opacity-20 rounded-full mix-blend-overlay filter blur-3xl transform translate-y-1/2"></div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 flex items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Liên Hệ Với Chúng Tôi</h1>
            <p className="text-xl md:text-2xl opacity-90">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-800 mb-2">{info.title}</h3>
                  {info.link ? (
                    <a
                      href={info.link}
                      className="text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      {info.content}
                    </a>
                  ) : (
                    <p className="text-gray-600">{info.content}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="py-12 bg-white overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-zinc-800 mb-6">Gửi Yêu Cầu Hỗ Trợ (Ticket)</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    disabled={!!user}
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full max-w-xl px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${user ? 'bg-gray-100' : ''}`}
                    placeholder="Nhập họ và tên của bạn"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      disabled={!!user}
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full max-w-xl px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${user ? 'bg-gray-100' : ''}`}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      disabled={!!user}
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full max-w-xl px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${user ? 'bg-gray-100' : ''}`}
                      placeholder="0123 456 789"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full max-w-xl px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tóm tắt vấn đề của bạn..."
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Chủ đề <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full max-w-xl px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Chọn chủ đề</option>
                    <option value="Tư vấn sản phẩm">Tư vấn sản phẩm</option>
                    <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
                    <option value="Bảo hành">Bảo hành</option>
                    <option value="Hợp tác kinh doanh">Hợp tác kinh doanh</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full max-w-xl px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                  ></textarea>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full max-w-xl bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Gửi Yêu Cầu</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Map & Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-gray-100 rounded-lg overflow-hidden h-80 lg:h-[500px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.8639810443356!2d105.7445984147635!3d21.038127792834645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135cab158d234d7%3A0x69666249a0d81b83!2zVHLGsOG7nW5nIENhbyDEkS4gRlBUIFBo4buvIFRo4buLIC0gSMOgIE7hu5lp!5e0!3m2!1svi!2s!4v1678888888888!5m2!1svi!2s"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full border-0"
                ></iframe>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-cyan-500 p-6 rounded-lg text-white">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="h-6 w-6" />
                  <h3 className="text-xl font-semibold">Kết Nối Với Chúng Tôi</h3>
                </div>
                <p className="mb-6 opacity-90">
                  Theo dõi chúng tôi trên các kênh mạng xã hội để cập nhật tin tức và ưu đãi mới nhất
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Youtube className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section className="py-12 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-zinc-800 mb-4">Hệ Thống Chi Nhánh</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Security Shop có mặt tại các thành phố lớn trên cả nước
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {branches.map((branch, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img
                  src={branch.image}
                  alt={branch.city}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-zinc-800 mb-3">{branch.city}</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <a href={`tel:${branch.phone.replace(/\s/g, '')}`} className="hover:text-purple-600">
                        {branch.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-zinc-800 mb-4">Câu Hỏi Thường Gặp</h2>
            <p className="text-gray-600">
              Những câu hỏi khách hàng thường xuyên đặt ra
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-zinc-800 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-purple-600 to-cyan-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Cần Hỗ Trợ Ngay?</h2>
            <p className="text-xl mb-8 opacity-90">
              Gọi điện cho chúng tôi để được tư vấn miễn phí ngay bây giờ
            </p>
            <a
              href="tel:0123456789"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Phone className="h-5 w-5" />
              0123 456 789
            </a>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;