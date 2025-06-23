# 🚀 HƯỚNG DẪN DEPLOY MIỄN PHÍ - RAILWAY.COM

## 🎯 TẠI SAO CHỌN RAILWAY?
- ✅ $5 credit/tháng MIỄN PHÍ (đủ cho app nhỏ)
- ✅ Không ngủ như Heroku
- ✅ Deploy tự động từ GitHub
- ✅ SSL + Custom domain miễn phí
- ✅ Database included
- ✅ Monitoring & logs miễn phí

## 📋 BƯỚC 1: CHUẨN BỊ CODE

### 1.1 Tạo file railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "healthcheckInterval": 30
  }
}
```

### 1.2 Cập nhật package.json
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 1.3 Tạo .gitignore
```
node_modules/
*.log
.env
.DS_Store
game_machine.db
```

## 📋 BƯỚC 2: DEPLOY LÊN RAILWAY

### 2.1 Tạo GitHub Repository
```bash
# Trong thư mục game-manager-pwa
git init
git add .
git commit -m "Initial commit"
git branch -M main
# Tạo repo trên GitHub rồi push
```

### 2.2 Deploy trên Railway
1. Vào: https://railway.app
2. Đăng nhập bằng GitHub
3. Nhấn "New Project" → "Deploy from GitHub repo"
4. Chọn repository vừa tạo
5. Railway sẽ tự động build và deploy

### 2.3 Cấu hình Environment Variables
- Vào project → Variables tab
- Thêm: `PORT=3001`
- Thêm: `NODE_ENV=production`

## 📋 BƯỚC 3: CẤU HÌNH DOMAIN

### 3.1 Domain miễn phí Railway
- Vào Settings → Public Networking
- Nhấn "Generate Domain"
- Sẽ có domain: `your-app.railway.app`

### 3.2 Custom domain (nếu có)
- Mua domain (.com ~$10/năm)
- Vào Settings → Custom Domain
- Thêm domain và cấu hình DNS

## 📋 BƯỚC 4: THIẾT LẬP DATABASE PRODUCTION

### 4.1 Sử dụng Railway PostgreSQL
```bash
# Trong Railway dashboard
# Add service → PostgreSQL
# Sẽ có DATABASE_URL tự động
```

### 4.2 Migration từ SQLite sang PostgreSQL
```javascript
// Thêm vào server.js
const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
    // Sử dụng PostgreSQL
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} else {
    // Fallback SQLite cho development
    const Database = require('./database');
    const db = new Database();
}
```

## 📋 BƯỚC 5: MONITORING & BACKUP

### 5.1 Xem logs realtime
```bash
# Cài Railway CLI
npm install -g @railway/cli

# Login và xem logs
railway login
railway logs
```

### 5.2 Auto backup database
- Railway có auto backup PostgreSQL
- Hoặc setup cron job backup hàng ngày

## 💰 CHI PHÍ THỰC TẾ

### Free Tier Railway:
- ✅ $5 credit/tháng
- ✅ 500 hours runtime (đủ cho 24/7)
- ✅ 1GB RAM, 1GB storage
- ✅ 100GB bandwidth

### Nếu vượt quota:
- Pay-as-you-go: ~$5-10/tháng
- Vẫn rẻ hơn VPS hosting

## 🔧 TROUBLESHOOTING

### Lỗi build:
```bash
# Kiểm tra logs
railway logs

# Thường do thiếu dependencies
npm install --save missing-package
```

### Lỗi database:
```bash
# Kết nối PostgreSQL
railway connect

# Check database
\dt
SELECT * FROM users LIMIT 5;
```

## 🎯 KẾT QUẢ CUỐI CÙNG

✅ **Ứng dụng chạy 24/7 MIỄN PHÍ**
✅ **URL public**: https://game-manager-xyz.railway.app
✅ **SSL tự động**
✅ **Auto deploy** khi push code mới
✅ **Database backup** tự động
✅ **Monitoring** và logs
✅ **Scaling** tự động nếu cần

## 📱 SỬ DỤNG THỰC TẾ

Nhân viên siêu thị chỉ cần:
1. Mở trình duyệt trên điện thoại
2. Vào: https://game-manager-xyz.railway.app  
3. Đăng nhập và sử dụng bình thường
4. App hoạt động như localhost, nhưng trên internet

**🎉 HOÀN TOÀN MIỄN PHÍ CHO QUY MÔ NHỎ!** 