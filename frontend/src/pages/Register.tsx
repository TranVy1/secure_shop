import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, Mail, Lock, User as UserIcon, Phone, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axiosInstance from '../utils/axiosConfig';
import ResendVerification from '../components/ResendVerification';

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số'),
  confirmPassword: z.string(),
  name: z.string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên không được vượt quá 50 ký tự')
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Tên chỉ được chứa chữ cái và khoảng trắng'),
  phone: z.string()
    .regex(/^(\+84|0)[0-9]{9}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'Bạn phải đồng ý với điều khoản sử dụng'
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/register", {
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone || null,
      });

      setRegisteredEmail(data.email);
      setIsSuccess(true);
      toast.success("🎉 Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthRegister = (provider: 'google' | 'facebook') => {
    const redirectTo = new URLSearchParams(location.search).get('redirect');
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:12345';
    const oauthUrl = `${baseUrl}/oauth2/authorize/${provider}`;

    if (redirectTo) {
      window.location.href = `${oauthUrl}?redirect=${encodeURIComponent(redirectTo)}`;
    } else {
      window.location.href = oauthUrl;
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;

    if (strength <= 2) return { strength, label: 'Yếu', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Trung bình', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Mạnh', color: 'bg-green-500' };
    return { strength, label: 'Rất mạnh', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="mt-6 text-3xl font-bold text-zinc-800">
                Đăng ký thành công!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Vui lòng kiểm tra email để xác thực tài khoản
              </p>
              <p className="mt-1 text-base font-semibold text-purple-600">
                {registeredEmail}
              </p>
            </div>

            <div className="bg-white py-8 px-6 shadow-lg rounded-lg space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm mt-0.5">
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    Mở email và tìm thư từ Security Shop
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm mt-0.5">
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    Click vào link xác thực trong email
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm mt-0.5">
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    Đăng nhập và bắt đầu mua sắm
                  </p>
                </div>
              </div>

              {/* ✅ TÍCH HỢP COMPONENT RESEND VERIFICATION Ở ĐÂY */}
              <div className="pt-6 border-t border-gray-200">
                <ResendVerification email={registeredEmail} />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsSuccess(false)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors mb-3"
                >
                  Đăng ký lại
                </button>
                <Link
                  to="/login"
                  className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
                >
                  Về trang đăng nhập
                </Link>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Lưu ý
                  </h3>
                  <p className="text-sm text-blue-700">
                    Link xác thực có hiệu lực trong 24 giờ. Nếu không thấy email, vui lòng kiểm tra thư mục spam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Register form
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <Shield className="h-12 w-12 text-purple-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-zinc-800">
              Tạo tài khoản mới
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Hoặc{' '}
              <Link
                to="/login"
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                đăng nhập nếu đã có tài khoản
              </Link>
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={`appearance-none block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Nhập email của bạn"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('name')}
                    type="text"
                    autoComplete="name"
                    className={`appearance-none block w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('phone')}
                    type="tel"
                    autoComplete="tel"
                    className={`appearance-none block w-full pl-10 pr-3 py-2 border ${errors.phone ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="0123456789"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`appearance-none block w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-semibold ${passwordStrength.strength <= 2 ? 'text-red-600' :
                          passwordStrength.strength <= 3 ? 'text-yellow-600' :
                            'text-green-600'
                        }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}

                {/* Password requirements */}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">Mật khẩu phải có:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li className={password?.length >= 8 ? 'text-green-600' : ''}>
                      ✓ Ít nhất 8 ký tự
                    </li>
                    <li className={/[A-Z]/.test(password || '') ? 'text-green-600' : ''}>
                      ✓ 1 chữ hoa
                    </li>
                    <li className={/[a-z]/.test(password || '') ? 'text-green-600' : ''}>
                      ✓ 1 chữ thường
                    </li>
                    <li className={/[0-9]/.test(password || '') ? 'text-green-600' : ''}>
                      ✓ 1 chữ số
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`appearance-none block w-full pl-10 pr-10 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      {...register('agreeToTerms')}
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="text-gray-700">
                      Tôi đồng ý với{' '}
                      <Link to="/terms" className="text-purple-600 hover:text-purple-500">
                        Điều khoản sử dụng
                      </Link>
                      {' '}và{' '}
                      <Link to="/privacy" className="text-purple-600 hover:text-purple-500">
                        Chính sách bảo mật
                      </Link>
                    </label>
                  </div>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang đăng ký...
                    </div>
                  ) : (
                    'Đăng ký'
                  )}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* Google button */}
                <button
                  type="button"
                  onClick={() => handleOAuthRegister('google')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.32 1.23 8.68 3.23l6.46-6.46C34.95 2.64 29.88 1 24 1 14.91 1 7.11 6.48 3.64 14.12l7.47 5.79C12.6 13.53 17.82 9.5 24 9.5z"
                    />
                    <path
                      fill="#34A853"
                      d="M46.15 24.49c0-1.64-.15-3.21-.43-4.74H24v9.48h12.4c-.54 2.85-2.13 5.26-4.53 6.9l7.02 5.46c4.09-3.77 6.42-9.32 6.42-17.1z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.97 28.44a14.6 14.6 0 0 1-.76-4.44c0-1.54.27-3.03.76-4.44l-7.33-5.69C2.53 16.54 1.5 20.16 1.5 24s1.03 7.46 2.16 10.13l7.31-5.69z"
                    />
                    <path
                      fill="#4285F4"
                      d="M24 46c5.92 0 10.87-1.96 14.49-5.33l-7.01-5.46c-1.96 1.34-4.52 2.29-7.48 2.29-6.18 0-11.41-4.03-13.04-9.32l-7.31 5.69C7.1 41.55 14.9 46 24 46z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                {/* Facebook button */}
                <button
                  type="button"
                  onClick={() => handleOAuthRegister('facebook')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#1877F2"
                      d="M24 1C11.3 1 1 11.3 1 24c0 11.4 8.3 20.9 19.2 22.8V30.6h-5.8v-6.6h5.8v-5.1c0-5.8 3.5-9 8.7-9 2.5 0 5.1.4 5.1.4v5.6h-2.9c-2.9 0-3.8 1.8-3.8 3.6v4.5h6.4l-1 6.6h-5.4v16.2C38.7 44.9 47 35.4 47 24 47 11.3 36.7 1 24 1z"
                    />
                    <path
                      fill="#fff"
                      d="M32.4 30.6l1-6.6h-6.4v-4.5c0-1.8.9-3.6 3.8-3.6h2.9v-5.6s-2.6-.4-5.1-.4c-5.2 0-8.7 3.2-8.7 9v5.1h-5.8v6.6h5.8v16.2a23 23 0 0 0 7.2 0V30.6h5.3z"
                    />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;