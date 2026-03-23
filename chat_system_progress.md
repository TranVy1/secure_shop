# Kế hoạch và Tiến trình: Hệ thống Chat Thực thời (Real-time Live Chat)

## 1. Thiết kế Hệ thống
Hệ thống cho phép:
- User nhắn tin cho Bot (tự động trả lời qua Gemini AI).
- User có thể yêu cầu "Gặp tư vấn viên" để gọi Admin.
- Admin nhận thông báo và có thể "Take over" (Tiếp quản) phiên chat để chat trực tiếp với User.

### Database Schema (Đã thiết kế)
- `chat_sessions`: Lưu trữ phiên chat (id, user_id, admin_id, is_active).
- `chat_messages`: Lưu trữ tin nhắn chat (id, session_id, sender_type: USER/ADMIN/BOT/SYSTEM, content).

## 2. Tiến trình Backend (Hoàn thành 100% ✅)
Các file và class đã được tạo trong mã nguồn Spring Boot:

1. **Entities & Enums**:
   - `ChatSenderType.java`: Enum (USER, ADMIN, BOT, SYSTEM).
   - `ChatSession.java`: Entity mapping với bảng `chat_sessions`.
   - `ChatMessage.java`: Entity mapping với bảng `chat_messages`.

2. **Repositories & DTOs**:
   - `ChatSessionRepository.java`, `ChatMessageRepository.java`: Quản lý truy xuất DB.
   - `ChatSessionDTO`, `ChatMessageDTO`, `ChatMessagePayload`, `AdminChatMessagePayload`: Các DTO chuyển giao dữ liệu.

3. **Service Layer**:
   - `LiveChatService.java` & `LiveChatServiceImpl.java`: Toàn bộ logic định tuyến tin nhắn giữa User, AI Bot và Admin; Logic tạo session, gán Admin, `getUserIdBySessionId()`.
   - `SystemMessage()`: Gửi thông báo hệ thống/bot cho cả User và Admin (nếu có).

4. **Controllers (REST & STOMP)**:
   - `LiveChatController.java`: API REST (lấy session, lịch sử, danh sách session admin, assign, close).
   - `LiveChatSTOMPController.java`: WebSocket STOMP (`/chat.user.send` và `/chat.admin.send`) — đã fix bug routing admin messages.

## 3. Tiến trình Frontend (Hoàn thành 100% ✅)

1. **API Layer**:
   - `liveChatApi` trong `api.ts`: REST endpoints (getMySession, getSessionHistory, getActiveSessions, assignSession, closeSession).

2. **User Chat Widget** (Góc phải màn hình):
   - `ChatWidget.tsx`: FAB button + STOMP WebSocket connection (dùng chung cho notifications + chat).
   - `ChatPanel.tsx`: Giao diện chat real-time qua STOMP WebSocket (không dùng REST cũ nữa). Hỗ trợ tin nhắn System, Bot, Admin, Quick Actions "Gặp tư vấn viên".

3. **Admin Chat Dashboard**:
   - `AdminLiveChat.tsx`: Trang quản lý chat 2 cột (danh sách session + cửa sổ chat live).
   - Đăng ký tab "Chat trực tiếp" trong `Admin.tsx` (group: system, icon: MessageCircle).

## 4. Hệ thống đã hoàn thành - Sẵn sàng test! 🎉
