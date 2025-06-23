# Game Manager PWA 📱

Ứng dụng quản lý máy chơi game được tối ưu cho mobile dưới dạng Progressive Web App (PWA).

## 🚀 Tính năng

- **📱 PWA Support**: Cài đặt như app thật trên điện thoại
- **🔒 Phân quyền**: Manager và Employee roles
- **📊 Nhập liệu**: Coin In/Out với tính toán profit tự động
- **📈 Dashboard**: Thống kê doanh thu real-time
- **📋 Lịch sử**: Xem lại các giao dịch đã nhập
- **📱 Mobile-first**: UI được thiết kế ưu tiên cho mobile
- **⚡ Offline Ready**: Service Worker cache

## 🛠️ Cài đặt

```bash
cd game-manager-pwa
npm install
npm start
```

Server sẽ chạy tại: http://localhost:3001

## 📱 Test trên điện thoại

### Cách 1: Local Network
1. Tìm IP của máy tính (ví dụ: 192.168.1.100)
2. Truy cập: `http://192.168.1.100:3001` trên điện thoại
3. Chọn "Add to Home Screen" để cài đặt PWA

### Cách 2: ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3001
```
Dùng URL ngrok để truy cập từ điện thoại.

## 👤 Tài khoản demo

- **Manager**: manager1 / 123456
- **Employee**: nv001 / 123456

## 📱 Tính năng PWA

- ✅ Installable (Add to Home Screen)
- ✅ Service Worker caching
- ✅ Offline support
- ✅ Mobile-optimized UI
- ✅ Touch-friendly controls
- ✅ Responsive design

## 🔧 So sánh với web version

| Tính năng | Web Version | PWA Version |
|-----------|-------------|-------------|
| Port | 3000 | 3001 |
| UI | Desktop-first | Mobile-first |
| Install | Không | Có (PWA) |
| Offline | Không | Có (Service Worker) |
| Complex features | Đầy đủ | Simplified |
| Admin features | Có | Không (chỉ Manager/Employee) |

## 📂 Cấu trúc

```
game-manager-pwa/
├── server.js           # Express server với PWA manifest
├── database.js         # Copy từ project gốc
├── game_machine.db     # Copy database
├── public/
│   ├── index.html      # Mobile-optimized HTML
│   ├── sw.js          # Service Worker
│   ├── manifest.json   # PWA Manifest (auto-generated)
│   └── icons/         # PWA icons
├── package.json
└── README.md
```

## 🎯 Sử dụng

1. **Đăng nhập** với tài khoản demo
2. **Nhập liệu**: Chọn máy, nhập coin in/out, xem profit tự động
3. **Dashboard**: Xem thống kê doanh thu (chỉ Manager)
4. **Lịch sử**: Xem các giao dịch đã nhập

## 💡 Tips

- Sử dụng date picker để chọn ngày giao dịch chính xác
- Profit được tính tự động: Coin In - Coin Out
- Dữ liệu được sync với server gốc (cùng database)
- UI được tối ưu cho touch controls

## 🐛 Debug

Nếu gặp lỗi:
1. Check console log trong browser
2. Verify database connection
3. Restart server: `npm start`

---

**Phát triển bởi Game Manager Team** 🎮 