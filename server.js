const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const Database = require('./database');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001; // Railway sẽ set PORT environment variable
const db = new Database();

// Middleware
app.use(cors({
    credentials: true,
    origin: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'game-machine-pwa-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Middleware để disable cache cho các file quan trọng
app.use((req, res, next) => {
    if (req.url === '/' || req.url === '/index.html' || req.url === '/sw.js') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
    next();
});

// Serve PWA static files with cache control
app.use(express.static('public', {
    maxAge: 0, // No cache for development
    etag: false,
    setHeaders: (res, path) => {
        // Force no-cache for HTML and JS files
        if (path.endsWith('.html') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// PWA Manifest
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "Game Manager - Quản Lý Máy Chơi Game",
        "short_name": "Game Manager",
        "description": "Ứng dụng quản lý máy chơi game chuyên nghiệp",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#667eea",
        "theme_color": "#667eea",
        "orientation": "portrait",
        "icons": [
            {
                "src": "/icons/icon-192x192.svg",
                "sizes": "192x192",
                "type": "image/svg+xml"
            },
            {
                "src": "/icons/icon-512x512.svg",
                "sizes": "512x512",
                "type": "image/svg+xml"
            }
        ],
        "categories": ["business", "productivity"],
        "lang": "vi",
        "screenshots": []
    });
});

// Route đặc biệt cho service worker để chèn version
app.get('/sw.js', (req, res) => {
    const swPath = path.join(__dirname, 'public', 'sw.js');
    fs.readFile(swPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Could not read sw.js file:', err);
            return res.status(500).send('Could not read sw.js file');
        }
        res.setHeader('Content-Type', 'application/javascript');
        const newData = data.replace('{{CACHE_VERSION}}', Date.now());
        res.send(newData);
    });
});

// Health check endpoint for auto-detection
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        server: 'game-manager-pwa',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Middleware kiểm tra đăng nhập
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Yêu cầu đăng nhập' });
    }
}

// Middleware kiểm tra quyền quản lý
function requireManagerOrAdmin(req, res, next) {
    if (req.session && req.session.user && 
        (req.session.user.role === 'admin' || req.session.user.role === 'manager')) {
        next();
    } else {
        res.status(403).json({ error: 'Không có quyền truy cập' });
    }
}

// Routes

// Trang chủ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, remember_me } = req.body;
        const user = await db.authenticateUser(username, password);
        
        if (user) {
            req.session.user = user;
            
            // Extend session expiry nếu remember me
            if (remember_me) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 ngày
            } else {
                req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 giờ mặc định
            }
            
            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    role: user.role,
                    branch_id: user.branch_id,
                    branch_name: user.branch_name
                },
                remember_me: remember_me
            });
        } else {
            res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Lỗi đăng nhập' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Lỗi đăng xuất' });
        } else {
            res.json({ success: true, message: 'Đăng xuất thành công' });
        }
    });
});

app.get('/api/profile', requireAuth, (req, res) => {
    res.json({ 
        user: {
            id: req.session.user.id,
            username: req.session.user.username,
            full_name: req.session.user.full_name,
            role: req.session.user.role,
            branch_id: req.session.user.branch_id,
            branch_name: req.session.user.branch_name
        }
    });
});

// API routes (copy từ server gốc)
app.get('/api/branches', requireAuth, async (req, res) => {
    try {
        const branches = await db.getAllBranches();
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách chi nhánh' });
    }
});

app.get('/api/users', requireManagerOrAdmin, async (req, res) => {
    try {
        const user = req.session.user;
        const users = await db.getUsers(user.role === 'manager' ? user.branch_id : null);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách nhân viên' });
    }
});

app.get('/api/machines', requireAuth, async (req, res) => {
    try {
        const { branch_id } = req.query;
        const user = req.session.user;
        
        let branchId = null;
        if (user.role === 'employee') {
            branchId = user.branch_id;
        } else if (branch_id) {
            branchId = parseInt(branch_id);
        }
        
        const machines = await db.getAllMachines(branchId);
        res.json(machines);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách máy chơi game' });
    }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
    try {
        const { machine_id, coins_in, coins_out, note, transaction_date } = req.body;
        const user = req.session.user;
        
        if (!machine_id || coins_in < 0 || coins_out < 0) {
            return res.status(400).json({ 
                error: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.' 
            });
        }

        const machines = await db.getAllMachines();
        const machine = machines.find(m => m.id === parseInt(machine_id));
        
        if (!machine) {
            return res.status(404).json({ error: 'Không tìm thấy máy chơi game' });
        }

        if (user.role === 'employee' && machine.branch_id !== user.branch_id) {
            return res.status(403).json({ 
                error: 'Bạn chỉ có thể nhập liệu cho máy của chi nhánh mình' 
            });
        }

        const result = await db.addTransaction(
            machine_id, 
            machine.branch_id, 
            user.id, 
            coins_in, 
            coins_out, 
            note,
            transaction_date
        );
        
        res.json({ 
            success: true, 
            message: 'Đã thêm giao dịch thành công',
            data: result 
        });
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Lỗi khi thêm giao dịch' });
    }
});

app.get('/api/transactions', requireAuth, async (req, res) => {
    try {
        const { branch_id, machine_id, user_id, start_date, end_date, sort_by, limit } = req.query;
        const user = req.session.user;
        
        let branchId = null;
        let userId = null;
        
        if (user.role === 'employee') {
            branchId = user.branch_id;
            userId = user.id;
        } else if (user.role === 'manager') {
            branchId = user.branch_id;
            if (user_id) {
                userId = parseInt(user_id);
            }
        } else if (user.role === 'admin') {
            if (branch_id) {
                branchId = parseInt(branch_id);
            }
            if (user_id) {
                userId = parseInt(user_id);
            }
        }
        
        const transactions = await db.getTransactions(
            branchId, 
            machine_id, 
            userId, 
            start_date, 
            end_date, 
            sort_by || 'date_desc', 
            parseInt(limit) || 50
        );
        res.json(transactions);
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ error: 'Lỗi khi lấy lịch sử giao dịch' });
    }
});

app.get('/api/dashboard', requireManagerOrAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const user = req.session.user;
        
        // Manager sẽ chỉ thấy chi nhánh của mình, admin có thể xem tất cả.
        const branchId = user.role === 'manager' ? user.branch_id : (req.query.branch_id || null);
        
        const dashboardData = await db.getDashboardData(branchId, start_date, end_date);
        
        res.json(dashboardData);

    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu dashboard' });
    }
});

// Debug endpoint - get all machines without filters
app.get('/api/debug/machines', requireManagerOrAdmin, async (req, res) => {
    try {
        const allMachines = await db.getRevenue(null, null, null, null); // No filters
        const allTransactions = await db.getTransactions(null, null, null, null, null, 'date_desc', 10);
        
        res.json({
            machines: allMachines,
            recent_transactions: allTransactions.transactions || allTransactions,
            debug_info: {
                machines_count: allMachines?.length || 0,
                transactions_count: allTransactions.transactions?.length || allTransactions?.length || 0
            }
        });
    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({ error: 'Debug failed', details: error.message });
    }
});

// Export CSV endpoint
app.get('/api/export/csv', requireManagerOrAdmin, async (req, res) => {
    try {
        const { branch_id, start_date, end_date } = req.query;
        const user = req.session.user;
        
        let branchId = null;
        if (user.role === 'manager') {
            branchId = user.branch_id;
        } else if (branch_id) {
            branchId = parseInt(branch_id);
        }
        
        // Get detailed transactions for export
        const transactions = await db.getTransactions(
            branchId, 
            null, // all machines
            null, // all users
            start_date, 
            end_date, 
            'date_desc', 
            1000 // high limit for export
        );

        // Convert to CSV format
        const csvHeader = [
            'Ngày Giao Dịch',
            'Ngày Nhập',
            'Máy',
            'Vị Trí',
            'Chi Nhánh',
            'Nhân Viên',
            'Xu Vào',
            'Xu Ra',
            'Doanh Thu',
            'Ghi Chú',
            'Trạng Thái'
        ].join(',');

        const csvRows = transactions.transactions ? transactions.transactions.map(t => {
            const createdDate = new Date(t.created_at).toLocaleDateString('vi-VN');
            const transactionDate = new Date(t.transaction_date).toLocaleDateString('vi-VN');
            const isLate = new Date(t.created_at).toISOString().split('T')[0] > t.transaction_date;
            
            return [
                `"${transactionDate}"`,
                `"${createdDate}"`,
                `"${t.machine_name || 'N/A'}"`,
                `"${t.location || 'N/A'}"`,
                `"${t.branch_name || 'N/A'}"`,
                `"${t.user_name || 'N/A'}"`,
                t.coins_in || 0,
                t.coins_out || 0,
                t.revenue || 0,
                `"${(t.note || '').replace(/"/g, '""')}"`,
                `"${isLate ? 'Nhập muộn' : 'Đúng giờ'}"`
            ].join(',');
        }) : [];

        const csvContent = [csvHeader, ...csvRows].join('\n');

        // Set headers for file download
        const filename = `doanh-thu-${start_date || 'all'}-${end_date || 'all'}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Add BOM for Excel UTF-8 support
        res.send('\ufeff' + csvContent);
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: 'Lỗi khi xuất file CSV' });
    }
});

// Reset data endpoint (for managers)
app.post('/api/reset-data', requireManagerOrAdmin, async (req, res) => {
    try {
        const user = req.session.user;
        
        let branchId = null;
        if (user.role === 'manager') {
            branchId = user.branch_id;
        }
        
        // Only allow reset for specific branch if manager
        if (user.role === 'manager' && !branchId) {
            return res.status(403).json({ error: 'Manager cần có chi nhánh để reset dữ liệu' });
        }
        
        // For safety, we'll only reset transactions, not machines/users
        const result = await db.resetTransactions(branchId);
        
        res.json({ 
            success: true, 
            message: user.role === 'manager' 
                ? `Đã xóa tất cả giao dịch của chi nhánh ${user.branch_name}`
                : 'Đã xóa tất cả giao dịch của hệ thống'
        });
    } catch (error) {
        console.error('Error resetting data:', error);
        res.status(500).json({ error: 'Lỗi khi reset dữ liệu' });
    }
});

// Xử lý lỗi 404
app.use((req, res) => {
    res.status(404).json({ error: 'API endpoint không tồn tại' });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`📱 PWA Server đang chạy tại http://localhost:${PORT}`);
    console.log('🚀 Game Manager PWA đã sẵn sàng cho mobile!');
});

process.on('SIGINT', () => {
    console.log('🛑 Đang tắt PWA server...');
    db.close();
    process.exit(0);
}); 