# Ứng dụng Quản lý Quán Game (Game Manager PWA)

Một ứng dụng web tiến bộ (Progressive Web App - PWA) được thiết kế chuyên biệt để quản lý các mô hình kinh doanh cho thuê máy chơi game (ví dụ: quán PlayStation, PC gaming lounge). Ứng dụng giúp theo dõi trạng thái máy, quản lý phiên chơi của khách, tự động tính tiền và cung cấp báo cáo doanh thu, với giao diện được tối ưu cho nhân viên sử dụng trên điện thoại di động.

## Tính năng cốt lõi

- **Quản lý Trạng thái Máy:** Theo dõi trực quan trạng thái của từng máy (Trống, Đang chơi, Cần bảo trì).
- **Quản lý Phiên chơi:** Dễ dàng bắt đầu và kết thúc một phiên chơi cho khách hàng, hệ thống tự động tính thời gian.
- **Tính tiền tự động:** Tự động tính tiền giờ chơi dựa trên bảng giá đã được cấu hình trước.
- **Phân quyền Người dùng:** Tích hợp sẵn 2 vai trò:
  - `Manager`: Toàn quyền truy cập, xem báo cáo doanh thu.
  - `Employee`: Chỉ thực hiện các tác vụ vận hành hàng ngày.
- **Dashboard Báo cáo:** Bảng điều khiển trực quan để theo dõi doanh thu và hoạt động của quán trong ngày.
- **Lịch sử Giao dịch:** Xem lại lịch sử chi tiết của tất cả các phiên chơi và hóa đơn đã thanh toán.
- **Hỗ trợ PWA:** Có thể "cài đặt" ứng dụng lên màn hình chính của điện thoại, hỗ trợ truy cập offline cho các tính năng cơ bản.

## Công nghệ & Kiến trúc Hệ thống

### Frontend
- **Ngôn ngữ:** HTML, CSS, JavaScript (Vanilla JS).
- **Kiến trúc:** Không sử dụng framework phức tạp để đảm bảo ứng dụng nhẹ, tốc độ tải nhanh và dễ bảo trì.
- **PWA:** Sử dụng Service Worker để cache tài nguyên, cho phép truy cập nhanh và hỗ trợ một số tính năng offline cơ bản.

### Backend
- **Nền tảng:** Node.js
- **Framework:** Express.js để xây dựng các API endpoint một cách nhanh chóng và hiệu quả.
- **Database:**
    - **Production:** Hỗ trợ `PostgreSQL` cho sự ổn định và mạnh mẽ.
    - **Development:** Sử dụng `SQLite` mặc định để đơn giản hóa việc cài đặt và khởi chạy ở môi trường local.

## Quy trình Phát triển & Triển khai

- **Quản lý mã nguồn:** Toàn bộ code được quản lý bằng `Git` và lưu trữ trên `GitHub`.
- **Triển khai:** Thiết kế để dễ dàng triển khai trên các nền tảng PaaS (Platform as a Service) như **Railway** hoặc **Heroku**.
- **Cập nhật:** Quy trình cập nhật rất đơn giản, chỉ cần đẩy (push) code mới lên nhánh `main`, hệ thống CI/CD của nhà cung cấp dịch vụ sẽ tự động build và triển khai phiên bản mới mà không gây gián đoạn.

## Cài đặt & Khởi chạy

```bash
# Di chuyển vào thư mục dự án
cd game-manager-pwa

# Cài đặt các gói phụ thuộc
npm install

# Khởi chạy server
npm start
```

Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3001`

## Quy trình sử dụng

1.  **Đăng nhập:** Sử dụng tài khoản có vai trò `Manager` hoặc `Employee`.
2.  **Bắt đầu phiên chơi:** Chọn một máy đang ở trạng thái "Trống" để bắt đầu tính giờ cho khách.
3.  **Kết thúc & Thanh toán:** Dừng phiên chơi. Hệ thống sẽ hiển thị tổng hóa đơn tiền giờ để nhân viên thanh toán với khách.
4.  **Xem báo cáo (Manager):** Truy cập Dashboard để xem thống kê doanh thu và các số liệu quan trọng khác.

## Tài khoản Demo

- **Manager**: `manager1` / `123456`
- **Employee**: `nv001` / `123456`

## Thử nghiệm trên điện thoại

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