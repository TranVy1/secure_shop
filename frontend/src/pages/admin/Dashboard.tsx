import React from 'react';

import { Users, Package, ShoppingCart, TrendingUp, UserPlus, MessageSquare, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';



type Props = {

  data?: any;

  onReload?: () => void;

};



const Dashboard: React.FC<Props> = ({ data }) => {

  const stats = data?.stats || { users: 0, orders: 0, revenue: 0, products: 0 };

  const activities = data?.activities || [];

  const revenueChartData = data?.revenueChartData || [];

  const quickStats = data?.quickStats || {

    conversionRate: 3.24,

    customerSatisfaction: 4.8,

    responseTime: 1.2

  };

  const trends = data?.trends || {

    users: 8.2,

    orders: 5.1,

    products: 12.3,

    revenue: 18.7

  };



  const getActivityIcon = (type: string) => {

    switch (type) {

      case 'order':

        return <ShoppingCart className="w-5 h-5 text-cyan-600" />;

      case 'user':

        return <UserPlus className="w-5 h-5 text-purple-600" />;

      case 'ticket':

        return <MessageSquare className="w-5 h-5 text-pink-600" />;

      case 'article':

        return <FileText className="w-5 h-5 text-green-600" />;

      case 'alert':

        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;

      default:

        return <CheckCircle className="w-5 h-5 text-gray-600" />;

    }

  };



  const getActivityBg = (type: string) => {

    switch (type) {

      case 'order':

        return 'bg-cyan-50';

      case 'user':

        return 'bg-purple-50';

      case 'ticket':

        return 'bg-pink-50';

      case 'article':

        return 'bg-green-50';

      case 'alert':

        return 'bg-yellow-50';

      default:

        return 'bg-gray-50';

    }

  };



  return (

    <div>

      <h2 className="text-2xl font-bold text-zinc-800 mb-6">Tổng quan hệ thống</h2>



      {/* Stats Grid */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">

          <div className="flex items-center justify-between mb-4">

            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">

              <Users className="w-6 h-6 text-blue-600" />

            </div>

            <div className="flex items-center text-green-600">

              <TrendingUp className="w-4 h-4 mr-1" />

              <span className="text-sm font-medium">+{trends.users}%</span>

            </div>

          </div>

          <h3 className="text-3xl font-bold mb-1 text-gray-900">{stats.users}</h3>

          <p className="text-gray-600 text-sm">Người dùng</p>

          <p className="text-gray-500 text-xs mt-1">so với tháng trước</p>

        </div>



        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">

          <div className="flex items-center justify-between mb-4">

            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">

              <ShoppingCart className="w-6 h-6 text-green-600" />

            </div>

            <div className="flex items-center text-green-600">

              <TrendingUp className="w-4 h-4 mr-1" />

              <span className="text-sm font-medium">+{trends.orders}%</span>

            </div>

          </div>

          <h3 className="text-3xl font-bold mb-1 text-gray-900">{stats.orders}</h3>

          <p className="text-gray-600 text-sm">Đơn hàng</p>

          <p className="text-gray-500 text-xs mt-1">so với tháng trước</p>

        </div>



        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">

          <div className="flex items-center justify-between mb-4">

            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">

              <Package className="w-6 h-6 text-purple-600" />

            </div>

            <div className="flex items-center text-green-600">

              <TrendingUp className="w-4 h-4 mr-1" />

              <span className="text-sm font-medium">+{trends.products}%</span>

            </div>

          </div>

          <h3 className="text-3xl font-bold mb-1 text-gray-900">{stats.products || 0}</h3>

          <p className="text-gray-600 text-sm">Sản phẩm</p>

          <p className="text-gray-500 text-xs mt-1">so với tháng trước</p>

        </div>



        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">

          <div className="flex items-center justify-between mb-4">

            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">

              <span className="text-xl text-orange-600">₫</span>

            </div>

            <div className="flex items-center text-green-600">

              <TrendingUp className="w-4 h-4 mr-1" />

              <span className="text-sm font-medium">+{trends.revenue}%</span>

            </div>

          </div>

          <h3 className="text-3xl font-bold mb-1 text-gray-900">{stats.revenue.toLocaleString()}</h3>

          <p className="text-gray-600 text-sm">Doanh thu</p>

          <p className="text-gray-500 text-xs mt-1">so với tháng trước</p>

        </div>

      </div>



      {/* Charts and Recent Activity */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        <div className="bg-white border border-gray-200 rounded-xl p-6 xl:col-span-2">

          <h3 className="text-lg font-semibold text-zinc-800 mb-4">Doanh thu 7 ngày qua</h3>

          <div className="h-80">

            <ResponsiveContainer width="100%" height="100%">

              <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />

                <YAxis dataKey="revenue" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`} width={60} />

                <RechartsTooltip

                  formatter={(value: number) => [`${value.toLocaleString()} ₫`, 'Doanh thu']}

                  cursor={{ fill: '#f3f4f6' }}

                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}

                />

                <Line 

                  type="monotone" 

                  dataKey="revenue" 

                  stroke="#3b82f6" 

                  strokeWidth={2}

                  dot={{ fill: '#3b82f6', r: 4 }}

                  activeDot={{ r: 6 }}

                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </div>



        {/* Quick Statistics */}

        <div className="bg-white border border-gray-200 rounded-xl p-6">

          <h3 className="text-lg font-semibold text-zinc-800 mb-4">Thống kê nhanh</h3>

          <div className="space-y-6">

            <div>

              <div className="flex justify-between items-center mb-2">

                <span className="text-sm text-gray-600">Tỷ lệ chuyển đổi</span>

                <span className="text-sm font-medium text-zinc-800">{quickStats.conversionRate}%</span>

              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">

                <div 

                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"

                  style={{ width: `${Math.min(quickStats.conversionRate * 10, 100)}%` }}

                />

              </div>

            </div>



            <div>

              <div className="flex justify-between items-center mb-2">

                <span className="text-sm text-gray-600">Sự hài lòng của khách hàng</span>

                <span className="text-sm font-medium text-zinc-800">{quickStats.customerSatisfaction}/5.0</span>

              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">

                <div 

                  className="bg-green-500 h-2 rounded-full transition-all duration-300"

                  style={{ width: `${(Math.min(quickStats.customerSatisfaction, 5) / 5) * 100}%` }}

                />

              </div>

            </div>



            <div>

              <div className="flex justify-between items-center mb-2">

                <span className="text-sm text-gray-600">Thời gian phản hồi</span>

                <span className="text-sm font-medium text-zinc-800">{quickStats.responseTime}s</span>

              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">

                <div 

                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"

                  style={{ width: `${Math.min((5 - quickStats.responseTime) * 20, 100)}%` }}

                />

              </div>

            </div>

          </div>

        </div>

      </div>



      {/* Recent Activity */}

      <div className="bg-white border border-gray-200 rounded-xl p-6">

        <h3 className="text-lg font-semibold text-zinc-800 mb-4">Hoạt động gần đây</h3>

        {activities.length > 0 ? (

          <div className="space-y-3">

            {activities.map((activity: any, index: number) => (

              <div

                key={index}

                className={`flex items-start gap-4 p-4 rounded-lg ${getActivityBg(activity.type)} hover:shadow-sm transition-shadow`}

              >

                <div className="flex-shrink-0 mt-1">

                  {getActivityIcon(activity.type)}

                </div>

                <div className="flex-1 min-w-0">

                  <p className="text-sm font-medium text-zinc-800">{activity.title}</p>

                  <p className="text-xs text-gray-600 mt-1">{activity.description}</p>

                  <p className="text-xs text-gray-500 mt-2">{activity.time}</p>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <p className="text-gray-500 text-center py-8">Chưa có dữ liệu hoạt động</p>

        )}

      </div>

    </div>

  );

};



export default Dashboard;



// eslint-disable-next-line react-refresh/only-export-components

export async function loadData() {

  try {

    const { orderApi, productApi, userApi, InventoryApi } = await import('../../utils/api');



    const [ordersResponse, productsResponse, usersResponse, inventoriesResponse] = await Promise.all([

      orderApi.getAll({ page: 0, size: 20 }),

      productApi.getAll({ page: 0, size: 20 }),

      userApi.getAllUsers(),

      InventoryApi.getAll().catch((err) => {

        console.error('Inventory API error:', err);

        return { content: [] };

      })

    ]);



    const orders = ordersResponse.content || ordersResponse || [];

    const products = productsResponse.content || [];

    const users = usersResponse.content || usersResponse || [];

    const inventories = inventoriesResponse.content || [];



    // Tính toán thống kê

    const totalUsers = users.length;

    const totalOrders = await orderApi.countOrders();

    const totalProducts = await productApi.countProducts();



    // Doanh thu từ đơn đã giao và đã thanh toán

    const totalRevenue = orders

      .filter((o: any) => o.status === 'DELIVERED' && o.paymentStatus === 'PAID')

      .reduce((sum: number, o: any) => sum + (o.grandTotal || 0), 0);



    // Tạo hoạt động gần đây từ dữ liệu thực

    const activities: Array<{ type: string; title: string; description: string; time: string }> = [];



    // Đơn hàng gần đây

    const recentOrders = [...orders]

      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      .slice(0, 3);



    recentOrders.forEach((order: any) => {

      const timeAgo = getTimeAgo(order.createdAt);

      const statusText =

        order.status === 'DELIVERED' ? 'đã giao' :

          order.status === 'PENDING' ? 'mới' :

            order.status === 'CANCELLED' ? 'đã hủy' : 'đang xử lý';



      activities.push({

        type: 'order',

        title: `Đơn hàng ${statusText} #${order.id.slice(0, 8)}`,

        description: `${order.user?.name || 'Khách hàng'} - Tổng tiền: ${order.grandTotal?.toLocaleString('vi-VN')} ₫`,

        time: timeAgo

      });

    });



    // Người dùng mới

    const recentUsers = [...users]

      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      .slice(0, 2);



    recentUsers.forEach((user: any) => {

      const timeAgo = getTimeAgo(user.createdAt);

      activities.push({

        type: 'user',

        title: 'Người dùng mới đăng ký',

        description: `${user.name} (${user.email})`,

        time: timeAgo

      });

    });



    if (inventories.length > 0) {

      const lowStockItems = inventories.filter((inv: any) =>

        inv.quantity < 10 && inv.quantity > 0

      ).slice(0, 2);



      lowStockItems.forEach((inv: any) => {

        activities.push({

          type: 'alert',

          title: 'Cảnh báo tồn kho',

          description: `Sản phẩm có SKU "${inv.productId}" sắp hết hàng (còn ${inv.quantity} sản phẩm)`,

          time: 'Hiện tại'

        });

      });



      const outOfStockItems = inventories.filter((inv: any) =>

        inv.quantity === 0

      ).slice(0, 2);



      outOfStockItems.forEach((inv: any) => {

        activities.push({

          type: 'alert',

          title: 'Sản phẩm đã hết hàng',

          description: `Sản phẩm có SKU "${inv.productId}" đã hết hàng - cần nhập thêm`,

          time: 'Hiện tại'

        });

      });

    } else if (products.length > 0) {

      // Fallback: Sử dụng dữ liệu từ Products API

      const outOfStockProducts = products.filter((p: any) => !p.inStock).slice(0, 3);



      outOfStockProducts.forEach((product: any) => {

        activities.push({

          type: 'alert',

          title: 'Sản phẩm đã hết hàng',

          description: `${product.name} (SKU: ${product.sku}) đã hết hàng - cần nhập thêm`,

          time: 'Hiện tại'

        });

      });



      const lowStockProducts = products.filter((p: any) =>

        p.inStock && p.stockQuantity != null && p.stockQuantity < 10

      ).slice(0, 2);



      lowStockProducts.forEach((product: any) => {

        activities.push({

          type: 'alert',

          title: 'Cảnh báo tồn kho',

          description: `${product.name} sắp hết hàng (còn ${product.stockQuantity || 'ít'} sản phẩm)`,

          time: 'Hiện tại'

        });

      });

    }



    activities.sort((a: any, b: any) => {

      const timeOrder: any = {

        'vừa xong': 0,

        'Hiện tại': 0,

      };

      const aOrder = timeOrder[a.time] ?? parseTimeAgo(a.time);

      const bOrder = timeOrder[b.time] ?? parseTimeAgo(b.time);

      return aOrder - bOrder;

    });



    const revenueByDay: Record<string, number> = {};

    const last7Days = Array.from({ length: 7 }, (_, i) => {

      const d = new Date();

      d.setDate(d.getDate() - (6 - i));

      return d.toISOString().split('T')[0];

    });



    last7Days.forEach(date => {

      revenueByDay[date] = 0;

    });



    orders.forEach((o: any) => {

      if (o.status === 'DELIVERED' && o.paymentStatus === 'PAID' && o.createdAt) {

        const date = o.createdAt.split('T')[0];

        if (revenueByDay[date] !== undefined) {

          revenueByDay[date] += (o.grandTotal || 0);

        }

      }

    });



    const revenueChartData = last7Days.map(date => {

      const parts = date.split('-');

      return {

        name: `${parts[2]}/${parts[1]}`, // DD/MM

        revenue: revenueByDay[date]

      };

    });



    // Calculate quick stats

    const conversionRate = totalOrders > 0 ? ((totalOrders / totalUsers) * 100).toFixed(2) : '0.00';

    const customerSatisfaction = (Math.min(4.5 + Math.random() * 0.5, 5.0)).toFixed(1); // Ensure max 5.0

    const responseTime = (0.8 + Math.random() * 0.8).toFixed(1); // Mock data



    // Calculate trends (mock data for demo)

    const userTrend = (5 + Math.random() * 10).toFixed(1);

    const orderTrend = (3 + Math.random() * 8).toFixed(1);

    const productTrend = (8 + Math.random() * 10).toFixed(1);

    const revenueTrend = (10 + Math.random() * 15).toFixed(1);



    return {

      stats: {

        users: totalUsers,

        orders: totalOrders,

        revenue: totalRevenue,

        products: totalProducts

      },

      activities: activities.slice(0, 8),

      revenueChartData,

      quickStats: {

        conversionRate: parseFloat(conversionRate),

        customerSatisfaction: parseFloat(customerSatisfaction),

        responseTime: parseFloat(responseTime)

      },

      trends: {

        users: parseFloat(userTrend),

        orders: parseFloat(orderTrend),

        products: parseFloat(productTrend),

        revenue: parseFloat(revenueTrend)

      }

    };

  } catch (error) {

    console.error('Error loading dashboard data:', error);

    return {

      stats: { users: 0, orders: 0, revenue: 0, products: 0 },

      activities: []

    };

  }

}



function getTimeAgo(dateString: string): string {

  const now = new Date();

  const past = new Date(dateString);

  const diffMs = now.getTime() - past.getTime();

  const diffMins = Math.floor(diffMs / 60000);

  const diffHours = Math.floor(diffMs / 3600000);

  const diffDays = Math.floor(diffMs / 86400000);



  if (diffMins < 1) return 'vừa xong';

  if (diffMins < 60) return `${diffMins} phút trước`;

  if (diffHours < 24) return `${diffHours} giờ trước`;

  if (diffDays < 7) return `${diffDays} ngày trước`;

  return past.toLocaleDateString('vi-VN');

}



function parseTimeAgo(timeStr: string): number {

  if (timeStr === 'vừa xong' || timeStr === 'Hiện tại') return 0;

  const match = timeStr.match(/(\d+)\s*(phút|giờ|ngày)/);

  if (!match) return 999999;

  const value = parseInt(match[1]);

  const unit = match[2];

  if (unit === 'phút') return value;

  if (unit === 'giờ') return value * 60;

  if (unit === 'ngày') return value * 1440;

  return 999999;

}

