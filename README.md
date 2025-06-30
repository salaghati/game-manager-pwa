# Quản Lý Máy Chơi Game

Một ứng dụng web tiến bộ (PWA) được thiết kế để theo dõi và quản lý doanh thu từ các máy game, dựa trên nghiệp vụ nhập liệu "Coin In" (xu vào) và "Coin Out" (xu ra).

## Live Demo

Bạn có thể trải nghiệm phiên bản live của ứng dụng tại địa chỉ:

**[https://game-manager-pwa-production-40d9.up.railway.app/](https://game-manager-pwa-production-40d9.up.railway.app/)**

## Tính năng cốt lõi

- **Nhập liệu Coin In/Out:** Giao diện đơn giản để nhân viên nhập tổng số xu vào và xu ra của từng máy vào cuối ngày hoặc cuối ca làm việc.
- **Tự động tính và lưu trữ lợi nhuận:** Hệ thống tự động tính `Profit = Coin In - Coin Out` và lưu vào cơ sở dữ liệu cho mỗi lần nhập liệu.
- **Dashboard Doanh thu:** Cung cấp cái nhìn tổng quan về doanh thu và lợi nhuận theo ngày, tuần, tháng với các bộ lọc trực quan.
- **Xuất file Excel:** Cho phép người quản lý xuất dữ liệu báo cáo ra file Excel để phân tích hoặc lưu trữ.
- **Lịch sử Giao dịch Nâng cao:** Lưu trữ và cho phép tìm kiếm, lọc lại toàn bộ lịch sử giao dịch với các bộ lọc chi tiết như `Chi nhánh`, `Máy`, `Nhân viên`, `Ngày tháng`, và trạng thái `Nhập muộn/Đúng giờ`.
- **Phân quyền Người dùng:** Hỗ trợ vai trò `Manager` (xem báo cáo, xuất file) và `Employee` (chỉ nhập liệu).
- **Hỗ trợ PWA:** Có thể cài đặt lên màn hình chính điện thoại để truy cập nhanh chóng.

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
2.  **Nhập liệu:**
    -   Vào tab "Nhập Liệu".
    -   Chọn Chi nhánh, Máy và Ngày giao dịch.
    -   Điền thông tin `Coin In` (xu vào) và `Coin Out` (xu ra).
    -   Nhấn "Lưu Giao Dịch".
3.  **Xem báo cáo (Manager):**
    -   Truy cập "Dashboard" để xem thống kê doanh thu.
    -   Sử dụng các bộ lọc nhanh hoặc tùy chỉnh theo ngày và nhấn "Cập nhật báo cáo".
    -   Nhấn "Export Excel" để tải về file báo cáo.
4.  **Tra cứu (Manager):** Vào "Lịch Sử" để tìm kiếm và lọc các giao dịch cũ theo nhiều tiêu chí.

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