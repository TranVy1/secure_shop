# Kế hoạch và Tiến trình: Hệ thống Chat Thực thời (Real-time Live Chat)

## 1. Thiết kế Hệ thống
Hệ thống cho phép:
- User nhắn tin cho Bot (tự động trả lời qua Gemini AI).
- User có thể yêu cầu "Gặp tư vấn viên" để gọi Admin.
- Admin nhận thông báo và có thể "Take over" (Tiếp quản) phiên chat để chat trực tiếp với User.

### Database Schema (Đã thiết kế)
- `chat_sessions`: Lưu trữ phiên chat (id, user_id, admin_id, is_active).
- `chat_messages`: Lưu trữ tin nhắn chat (id, session_id, sender_type: USER/ADMIN/BOT/SYSTEM, content).

## 2. Tiến trình Backend (Đã hoàn thành 100%)
Các file và class đã được tạo trong mã nguồn Spring Boot:

1. **Entities & Enums**:
   - `ChatSenderType.java`: Enum (USER, ADMIN, BOT, SYSTEM).
   - `ChatSession.java`: Entity mapping với bảng `chat_sessions`.
   - `ChatMessage.java`: Entity mapping với bảng `chat_messages`.

2. **Repositories & DTOs**:
   - `ChatSessionRepository.java`, `ChatMessageRepository.java`: Quản lý truy xuất DB.
   - `ChatSessionDTO`, `ChatMessageDTO`, `ChatMessagePayload`, `AdminChatMessagePayload`: Các DTO chuyển giao dữ liệu.

3. **Service Layer**:
   - `LiveChatService.java` & `LiveChatServiceImpl.java`: Chứa toàn bộ logic định tuyến (Routing) tin nhắn giữa User, AI Bot và Admin; Logic tạo session và gán Admin.

4. **Controllers (REST & STOMP)**:
   - `LiveChatController.java`: API REST cho phép Frontend lấy lịch sử tin nhắn, và lấy danh sách session đang mởi (Dành cho Admin).
   - `LiveChatSTOMPController.java`: Lắng nghe WebSockets (`/chat.user.send` và `/chat.admin.send`).

## 3. Các bước tiếp theo (Đang chờ)
Chúng ta sẽ tiếp tục xây dựng giao diện Frontend (React / Vite):

- **Bước 1**: Tạo trang Giao diện Dashboard cho Admin (Chia 2 cột: Danh sách user đang chat - Cửa sổ chat Live).
- **Bước 2**: Kết nối Chat Widget của User (Góc phải màn hình) để gửi tin nhắn qua STOMP WebSocket thay vì gọi API REST cũ.
- **Bước 3**: Xử lý Quick Replies (Nút gợi ý từ Bot).
