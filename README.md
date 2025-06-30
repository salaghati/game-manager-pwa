# Ứng dụng Quản lý Quán Game (Game Manager PWA) 🎮

Một ứng dụng web tiến bộ (Progressive Web App - PWA) được thiết kế chuyên biệt để quản lý các mô hình kinh doanh cho thuê máy chơi game (ví dụ: quán PlayStation, PC gaming lounge). Ứng dụng giúp theo dõi trạng thái máy, quản lý phiên chơi của khách, tự động tính tiền và cung cấp báo cáo doanh thu, với giao diện được tối ưu cho nhân viên sử dụng trên điện thoại di động.

## 🚀 Tính năng cốt lõi

- **📊 Quản lý Trạng thái Máy:** Theo dõi trực quan trạng thái của từng máy (Trống, Đang chơi, Cần bảo trì).
- **⏱️ Quản lý Phiên chơi:** Dễ dàng bắt đầu và kết thúc một phiên chơi cho khách hàng, hệ thống tự động tính thời gian.
- **💰 Tính tiền tự động:** Tự động tính tiền giờ chơi dựa trên bảng giá đã được cấu hình trước.
- **🥤 Bán hàng kèm theo:** Cho phép thêm các sản phẩm như đồ ăn, nước uống vào hóa đơn của khách.
- **🔒 Phân quyền Người dùng:** Tích hợp sẵn 2 vai trò:
  - `Manager`: Toàn quyền truy cập, xem báo cáo doanh thu.
  - `Employee`: Chỉ thực hiện các tác vụ vận hành hàng ngày.
- **📈 Dashboard Báo cáo:** Bảng điều khiển trực quan để theo dõi doanh thu và hoạt động của quán trong ngày.
- **📋 Lịch sử Giao dịch:** Xem lại lịch sử chi tiết của tất cả các phiên chơi và hóa đơn đã thanh toán.
- **📱 Hỗ trợ PWA:** Có thể "cài đặt" ứng dụng lên màn hình chính của điện thoại, hỗ trợ truy cập offline cho các tính năng cơ bản.

## 🛠️ Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Database:** Hỗ trợ PostgreSQL (cho production) và SQLite (cho local development).
- **Frontend:** HTML, CSS, JavaScript, Service Worker.

## ⚙️ Cài đặt & Khởi chạy

```bash
# Di chuyển vào thư mục dự án
cd game-manager-pwa

# Cài đặt các gói phụ thuộc
npm install

# Khởi chạy server
npm start
```

Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3001`

## 👨‍💻 Quy trình sử dụng

1.  **Đăng nhập:** Sử dụng tài khoản có vai trò `Manager` hoặc `Employee`.
2.  **Bắt đầu phiên chơi:** Chọn một máy đang ở trạng thái "Trống" để bắt đầu tính giờ cho khách.
3.  **Thêm sản phẩm:** Trong khi khách chơi, có thể thêm đồ ăn, nước uống vào hóa đơn hiện tại.
4.  **Kết thúc & Thanh toán:** Dừng phiên chơi. Hệ thống sẽ hiển thị tổng hóa đơn (tiền giờ + tiền sản phẩm) để nhân viên thanh toán với khách.
5.  **Xem báo cáo (Manager):** Truy cập Dashboard để xem thống kê doanh thu và các số liệu quan trọng khác.

## 👤 Tài khoản Demo

- **Manager**: `manager1` / `123456`
- **Employee**: `nv001` / `123456`

## 📱 Thử nghiệm trên điện thoại

### Cách 1: Sử dụng mạng nội bộ (Local Network)
1.  Tìm địa chỉ IP của máy tính trong mạng LAN (ví dụ: `192.168.1.100`).
2.  Mở trình duyệt trên điện thoại và truy cập: `http://192.168.1.100:3001`.
3.  Sử dụng tính năng "Thêm vào màn hình chính" (Add to Home Screen) của trình duyệt để cài đặt PWA.

### Cách 2: Sử dụng ngrok (Khuyến khích)
Công cụ này tạo một đường link công khai để bạn có thể truy cập server local từ bất kỳ đâu.
```bash
# Cài đặt ngrok (nếu chưa có)
npm install -g ngrok

# Public server ở port 3001
ngrok http 3001
```
Sử dụng đường link mà ngrok cung cấp để truy cập từ điện thoại.

---
*Được phát triển với mục tiêu đơn giản hóa việc quản lý vận hành cho các quán game.* 