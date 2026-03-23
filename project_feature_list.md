# Project Feature List

## Implemented Features
Dựa trên mã nguồn backend Spring Boot, dự án hiện đang là một hệ thống **E-Commerce / Điểm bán hàng (POS)** rất toàn diện, bao gồm các cụm tính năng chính:
- **Xác thực & Người dùng (Authentication & User):** Hỗ trợ đăng nhập, đăng ký, JWT Token, phân quyền Admin/User, lấy thông tin cá nhân. Có tích hợp OAuth2 (Google/Facebook) qua config.
- **Sản phẩm & Danh mục (Product Catalog):** Quản lý Sản phẩm, Danh mục (Category), Thương hiệu (Brand), hệ thống Mã vạch (Barcode), quản lý Hình ảnh/Video (MediaAsset).
- **Kho hàng (Inventory):** Quản lý tồn kho (Inventory), Lịch sử xuất/nhập kho (StockLog).
- **Mua sắm & Đơn hàng (Shopping & Orders):** Giỏ hàng (Cart Session & Item), Đặt hàng (Order & OrderItem). Hỗ trợ cả tính năng tạo đơn tại quầy cho nghiệp vụ Điểm bán hàng (POS).
- **Hóa đơn & Thanh toán (Invoice & Payment):** Quản lý thanh toán nội bộ và hỗ trợ tích hợp Cổng thanh toán **VNPay**. Xuất Hóa đơn (Invoice & InvoiceItem).
- **Vận chuyển & Chăm sóc khách hàng (Shipment & CRM):** Quản lý giao hàng (Shipment), Đánh giá sản phẩm (Review), Gửi yêu cầu hỗ trợ (Support Ticket) và Yêu cầu bảo hành (Warranty Request).
- **Khuyến mãi (Marketing):** Quản lý mã giảm giá (Discount).
- **Thống kê & Giám sát (Analytics & Monitoring):** Cung cấp API thống kê doanh thu/đơn hàng (Analytics), tích hợp Actuator & Prometheus/Grafana. Chat nội bộ (ChatController).

---

## Backend APIs
Dưới đây là danh sách quy hoạch REST API chính đã được định nghĩa trong controller:

| Phân hệ             | Base Endpoint               | Các Phương thức Chính (Methods) |
|---------------------|-----------------------------|----------------------------------------------------------|
| **Auth**            | `/api/auth`                 | `POST /login`, `POST /register`, `POST /refresh`         |
| **User**            | `/api/users`                | `GET /me`, `PUT /me`, `DELETE /me`, `GET /{id}` (Admin), `PUT /admin/{id}/enable` |
| **Product**         | `/api/products`             | `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}` |
| **Category**        | `/api/categories`           | CRUD tiêu chuẩn, `GET /active`                           |
| **Brand**           | `/api/brands`               | CRUD tiêu chuẩn dành cho thương hiệu                     |
| **Cart**            | `/api/cart`                 | `GET /`, `POST /add`, `PUT /update`, `DELETE /remove`    |
| **Order**           | `/api/orders`               | `POST /`, `GET /{id}`, `GET /user/my`, `PUT /{id}/status`|
| **POS**             | `/api/pos`                  | `POST /checkout` (Tạo đơn tại quầy)                      |
| **Payment (VNPay)** | `/api/vnpay`                | `POST /create-payment`, `GET /payment-callback`          |
| **Invoice**         | `/api/invoices`             | `GET /{id}`, `POST /generate`                            |
| **Inventory**       | `/api/inventory`            | `GET /product/{id}`, `PUT /restock`                      |
| **Shipment**        | `/api/shipments`            | `POST /`, `PATCH /mark-shipped/{id}`, `PATCH /mark-delivered/{id}` |
| **Review**          | `/api/reviews`              | `POST /`, `GET /product/{id}`, `DELETE /{id}`            |
| **Support Ticket**  | `/api/tickets`              | `POST /`, `GET /{id}`, `PUT /{id}/close`                 |
| **Warranty Req.**   | `/api/warranty-requests`    | `POST /`, `PATCH /approve/{id}`, `PATCH /reject/{id}`    |
| **Discount**        | `/api/discounts`            | CRUD tạo/sửa/xóa mã giảm giá                             |

---

## Database Schema
Hệ cơ sở dữ liệu (SQL Server) được tự động ánh xạ thông qua Hibernate JPA. Các bảng (Tables) và mối quan hệ chính như sau:

### 1. Nhóm Người dùng & Bảo mật
- **`User`**: (Khóa chính: `id`, Các trường: `username`, `password`, `email`, `role`,...).
- **`Address`**: (Khóa ngoại: `user_id`). Lưu trữ địa chỉ giao hàng của người dùng. *(Relation: User 1-N Address)*.

### 2. Nhóm Sản phẩm & Kho hàng
- **`Product`**: (Khóa chính `id`, name, price, description, etc.).
- **`Category`** & **`Brand`**: (Khóa chính `id`, name). *(Relation: Category 1-N Product, Brand 1-N Product)*.
- **`Inventory`**: Lưu trữ số lượng tồn kho (on_hand, reserved). *(Relation: Product 1-1 Inventory)*.
- **`StockLog`**: Lịch sử nhập/xuất kho. *(Relation: Inventory 1-N StockLog)*.
- **`MediaAsset`**: Hình ảnh/Video của sản phẩm. *(Relation: Product 1-N MediaAsset)*.
- **`Barcode`**: Mã vạch thực tế của từng item. *(Relation: Product 1-N Barcode)*.

### 3. Nhóm Giao dịch & Mua sắm
- **`CartSession`** & **`CartItem`**: Quản lý phiên giỏ hàng trước khi đặt. *(Relation: User 1-1 CartSession, CartSession 1-N CartItem)*.
- **`Order`**: Lưu thông tin đơn hàng (total_price, status, shipping_fee, discount_id). *(Relation: User 1-N Order)*.
- **`OrderItem`**: Chi tiết sản phẩm trong đơn. *(Relation: Order 1-N OrderItem, Product 1-N OrderItem)*.
- **`Payment`**: Giao dịch thanh toán. *(Relation: Order 1-1 Payment)*.
- **`Invoice`** & **`InvoiceItem`**: Hóa đơn đỏ xuất cho khách. *(Relation: Order 1-1 Invoice)*.
- **`Shipment`**: Mã vận đơn và trạng thái giao hàng. *(Relation: Order 1-1 Shipment)*.

### 4. Nhóm Tương tác Khách hàng
- **`Review`**: Rating và nhận xét. *(Relation: User 1-N Review, Product 1-N Review)*.
- **`SupportTicket`**: Xử lý khiếu nại. *(Relation: User 1-N Ticket)*.
- **`WarrantyRequest`**: Yêu cầu bảo hành. *(Relation: OrderItem 1-1 WarrantyRequest)*.
- **`Discount`**: Mã giảm giá. *(Relation: Discount 1-N Order)*.

---

## Missing / Suggested Features
Dựa vào Domain E-commerce hiện tại, dự án đã rất mạnh, nhưng có thể bổ sung các tính năng sau để hoàn thiện lên mức cấp Doanh nghiệp (Enterprise level):

1. **User Profile Picture (Avatar):** 
   - Hiện User chưa có field riêng cho Avatar. Mặc dù có `MediaAsset` nhưng nó chuyên cho Product. Cần thêm luồng upload ảnh cá nhân.
2. **Wishlist / Sản phẩm yêu thích:**
   - Cần thêm bảng `Wishlist` (N-N giữa User và Product) để người mua lưu lại sản phẩm ưng ý nhưng chưa muốn thêm vào Giỏ hàng.
3. **Flash Sale / Chiến dịch Marketing (Campaign):**
   - Đã có Discount (Mã giảm giá), nhưng chưa có bảng `Campaign/FlashSale` để ép giá sản phẩm xuống hàng loạt trong một khoảng thời gian đếm ngược.
4. **Hệ thống Điểm thưởng (Loyalty Points / Rewards):**
   - Tích điểm mỗi khi Order hoàn thành (`OrderStatus.DELIVERED`). Cần thêm cột `points` vào `User` và bảng `PointHistory`.
5. **Yêu cầu Đổi trả / Hoàn tiền (Return & Refund - RMA):**
   - Bạn đã có `WarrantyRequest`, nhưng chưa rõ ràng tách biệt luồng "Trả Hàng - Hoàn Tiền" khi khách nhận hàng không đúng mô tả. 
6. **Thông báo Real-time (WebSockets / Push Notifications):**
   - Thêm bảng `Notification` báo biến động (Đơn hàng đang giao, Trả lời Ticket...) và bắn qua WebSocket cho FE.
