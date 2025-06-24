const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Try to import pg with error handling
let Pool;
try {
    Pool = require('pg').Pool;
    console.log('✅ pg package loaded successfully');
} catch (error) {
    console.log('❌ pg package not found:', error.message);
}

class Database {
    constructor() {
        console.log('🔍 Initializing Database...');
        console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Not found');
        
        // Kiểm tra nếu có DATABASE_URL (PostgreSQL) thì dùng PostgreSQL, không thì dùng SQLite
        if (process.env.DATABASE_URL && Pool) {
            console.log('🐘 Connecting to PostgreSQL...');
            this.isPostgres = true;
            try {
                this.pool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
                });
                this.initPostgres();
            } catch (error) {
                console.error('❌ PostgreSQL connection failed:', error);
                console.log('🔄 Falling back to SQLite...');
                this.fallbackToSQLite();
            }
        } else {
            console.log('🗄️ Using SQLite database...');
            this.fallbackToSQLite();
        }
    }

    fallbackToSQLite() {
        this.isPostgres = false;
        this.db = new sqlite3.Database('game_machine.db');
        this.initSQLite();
    }

    initSQLite() {
        // Tạo bảng branches (chi nhánh)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS branches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                phone TEXT,
                manager_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tạo bảng users (người dùng)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT CHECK(role IN ('admin', 'manager', 'employee')) NOT NULL,
                branch_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES branches (id)
            )
        `);

        // Tạo bảng machines (máy chơi game) - thêm branch_id
        this.db.run(`
            CREATE TABLE IF NOT EXISTS machines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT,
                branch_id INTEGER NOT NULL,
                status TEXT DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'inactive')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES branches (id)
            )
        `);

        // Tạo bảng transactions (giao dịch xu) - thêm user_id và branch_id
        this.db.run(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id INTEGER,
                branch_id INTEGER,
                user_id INTEGER,
                coins_in INTEGER DEFAULT 0,
                coins_out INTEGER DEFAULT 0,
                revenue INTEGER DEFAULT 0,
                note TEXT,
                transaction_date DATE DEFAULT (date('now')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (machine_id) REFERENCES machines (id),
                FOREIGN KEY (branch_id) REFERENCES branches (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Khởi tạo dữ liệu mẫu sau khi tạo bảng xong
        setTimeout(() => {
            this.initSampleData();
        }, 100);
    }

    // Khởi tạo PostgreSQL
    async initPostgres() {
        try {
            console.log('🔧 Creating PostgreSQL tables...');
            
            // Tạo bảng branches
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS branches (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    address TEXT,
                    phone TEXT,
                    manager_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tạo bảng users
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    role TEXT CHECK(role IN ('admin', 'manager', 'employee')) NOT NULL,
                    branch_id INTEGER REFERENCES branches(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tạo bảng machines
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS machines (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    location TEXT,
                    branch_id INTEGER NOT NULL REFERENCES branches(id),
                    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'inactive')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tạo bảng transactions
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS transactions (
                    id SERIAL PRIMARY KEY,
                    machine_id INTEGER REFERENCES machines(id),
                    branch_id INTEGER REFERENCES branches(id),
                    user_id INTEGER REFERENCES users(id),
                    coins_in INTEGER DEFAULT 0,
                    coins_out INTEGER DEFAULT 0,
                    revenue INTEGER DEFAULT 0,
                    note TEXT,
                    transaction_date DATE DEFAULT CURRENT_DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            console.log('✅ PostgreSQL tables created successfully');
            
            // Khởi tạo dữ liệu mẫu
            setTimeout(() => {
                this.initSampleDataPostgres();
            }, 100);

        } catch (error) {
            console.error('❌ Error creating PostgreSQL tables:', error);
            throw error;
        }
    }

    // Khởi tạo dữ liệu mẫu cho PostgreSQL
    async initSampleDataPostgres() {
        try {
            const result = await this.pool.query("SELECT COUNT(*) as count FROM branches");
            
            if (result.rows[0].count == 0) {
                console.log('🏢 Khởi tạo dữ liệu mẫu PostgreSQL...');
                
                // Thêm chi nhánh
                await this.pool.query(`INSERT INTO branches (name, address, phone, manager_name) VALUES 
                    ('Chi Nhánh Quận 1', '123 Nguyễn Huệ, Q.1, TP.HCM', '028-1234-5678', 'Nguyễn Văn A'),
                    ('Chi Nhánh Quận 3', '456 Võ Văn Tần, Q.3, TP.HCM', '028-2345-6789', 'Trần Thị B')`);
                
                // Thêm users
                await this.pool.query(`INSERT INTO users (username, password, full_name, role, branch_id) VALUES 
                    ('admin', '123456', 'Quản Trị Viên', 'admin', NULL),
                    ('manager1', '123456', 'Nguyễn Văn A', 'manager', 1),
                    ('manager2', '123456', 'Trần Thị B', 'manager', 2),
                    ('nv001', '123456', 'Lê Văn C', 'employee', 1),
                    ('nv002', '123456', 'Phạm Thị D', 'employee', 2)`);
                
                // Thêm máy
                await this.pool.query(`INSERT INTO machines (name, location, branch_id) VALUES 
                    ('Máy Game 001 (Serial: 65543001)', 'Tầng 1 - Khu A', 1),
                    ('Máy Game 002 (Serial: 65543002)', 'Tầng 1 - Khu B', 1),
                    ('Máy Game 003 (Serial: 65543003)', 'Tầng 2 - Khu A', 1),
                    ('Máy Game 101 (Serial: 65543017)', 'Tầng 1 - Khu A', 2),
                    ('Máy Game 102 (Serial: 65543018)', 'Tầng 1 - Khu B', 2)`);
                
                console.log('✅ Dữ liệu mẫu PostgreSQL đã được khởi tạo!');
            } else {
                console.log('📊 Dữ liệu PostgreSQL đã tồn tại');
            }
        } catch (error) {
            console.error('❌ Error initializing PostgreSQL sample data:', error);
        }
    }

    initSampleData() {
        // Kiểm tra và thêm chi nhánh mẫu
        this.db.get("SELECT COUNT(*) as count FROM branches", (err, row) => {
            if (err) {
                console.error('Error checking branches:', err);
                return;
            }
            
            if (row && row.count === 0) {
                console.log('🏢 Khởi tạo dữ liệu mẫu...');
                
                // Thêm chi nhánh mẫu
                this.db.run(`INSERT INTO branches (name, address, phone, manager_name) VALUES 
                    ('Chi Nhánh Quận 1', '123 Nguyễn Huệ, Q.1, TP.HCM', '028-1234-5678', 'Nguyễn Văn A'),
                    ('Chi Nhánh Quận 3', '456 Võ Văn Tần, Q.3, TP.HCM', '028-2345-6789', 'Trần Thị B')`, (err) => {
                    if (err) {
                        console.error('Error inserting branches:', err);
                        return;
                    }
                    
                    // Thêm users mẫu (password: 123456)
                    this.db.run(`INSERT INTO users (username, password, full_name, role, branch_id) VALUES 
                        ('admin', '123456', 'Quản Trị Viên', 'admin', NULL),
                        ('manager1', '123456', 'Nguyễn Văn A', 'manager', 1),
                        ('manager2', '123456', 'Trần Thị B', 'manager', 2),
                        ('nv001', '123456', 'Lê Văn C', 'employee', 1),
                        ('nv002', '123456', 'Phạm Thị D', 'employee', 2)`, (err) => {
                        if (err) {
                            console.error('Error inserting users:', err);
                            return;
                        }

                        // Thêm máy chơi game mẫu
                        this.db.run(`INSERT INTO machines (name, location, branch_id) VALUES 
                            ('Máy Game 001 (Serial: 65543001)', 'Tầng 1 - Khu A', 1),
                            ('Máy Game 002 (Serial: 65543002)', 'Tầng 1 - Khu B', 1),
                            ('Máy Game 003 (Serial: 65543003)', 'Tầng 2 - Khu A', 1),
                            ('Máy Game 101 (Serial: 65543017)', 'Tầng 1 - Khu A', 2),
                            ('Máy Game 102 (Serial: 65543018)', 'Tầng 1 - Khu B', 2)`, (err) => {
                            if (err) {
                                console.error('Error inserting machines:', err);
                            } else {
                                console.log('✅ Dữ liệu mẫu đã được khởi tạo thành công!');
                            }
                        });
                    });
                });
            } else {
                console.log('📊 Dữ liệu đã tồn tại, bỏ qua khởi tạo mẫu');
            }
        });
    }

    // Lấy tất cả chi nhánh
    getAllBranches() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM branches ORDER BY id", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Lấy danh sách users (có thể lọc theo chi nhánh)
    getUsers(branchId = null) {
        return new Promise((resolve, reject) => {
            let query = "SELECT id, username, full_name, role, branch_id FROM users";
            const params = [];
            
            if (branchId) {
                query += " WHERE branch_id = ?";
                params.push(branchId);
            }
            
            query += " ORDER BY full_name";
            
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Lấy tất cả máy chơi game (có thể lọc theo chi nhánh)
    getAllMachines(branchId = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT m.*, b.name as branch_name 
                FROM machines m
                JOIN branches b ON m.branch_id = b.id
            `;
            const params = [];
            
            if (branchId) {
                query += " WHERE m.branch_id = ?";
                params.push(branchId);
            }
            
            query += " ORDER BY m.branch_id, m.id";
            
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Xác thực người dùng (đơn giản, trong thực tế cần hash password)
    authenticateUser(username, password) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT u.*, b.name as branch_name 
                FROM users u 
                LEFT JOIN branches b ON u.branch_id = b.id 
                WHERE u.username = ?
            `, [username], (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    // Đơn giản hóa - trong thực tế cần dùng bcrypt
                    if (password === '123456') {
                        resolve(row);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    // Thêm giao dịch mới
    addTransaction(machineId, branchId, userId, coinsIn, coinsOut, note = '', transactionDate = null) {
        return new Promise((resolve, reject) => {
            const revenue = coinsIn - coinsOut;
            const txDate = transactionDate || new Date().toISOString().split('T')[0];
            
            this.db.run(
                "INSERT INTO transactions (machine_id, branch_id, user_id, coins_in, coins_out, revenue, note, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [machineId, branchId, userId, coinsIn, coinsOut, revenue, note, txDate],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, revenue });
                }
            );
        });
    }

    // Lấy doanh thu theo chi nhánh, máy và thời gian
    getRevenue(branchId = null, machineId = null, startDate = null, endDate = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    b.name as branch_name,
                    m.name as machine_name,
                    m.location,
                    m.branch_id,
                    SUM(t.coins_in) as total_coins_in,
                    SUM(t.coins_out) as total_coins_out,
                    SUM(t.revenue) as total_revenue,
                    COUNT(t.id) as transaction_count
                FROM machines m
                LEFT JOIN transactions t ON m.id = t.machine_id
                JOIN branches b ON m.branch_id = b.id
            `;
            
            const params = [];
            let whereConditions = [];

            if (branchId) {
                whereConditions.push("m.branch_id = ?");
                params.push(branchId);
            }

            if (machineId) {
                whereConditions.push("m.id = ?");
                params.push(machineId);
            }

            if (startDate) {
                whereConditions.push("DATE(t.transaction_date) >= DATE(?)");
                params.push(startDate);
            }

            if (endDate) {
                whereConditions.push("DATE(t.transaction_date) <= DATE(?)");
                params.push(endDate);
            }

            if (whereConditions.length > 0) {
                query += " WHERE " + whereConditions.join(" AND ");
            }

            query += " GROUP BY m.id ORDER BY b.id, m.id";

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Lấy tổng doanh thu theo chi nhánh
    getBranchRevenue(branchId = null, startDate = null, endDate = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    b.id,
                    b.name as branch_name,
                    b.address,
                    b.manager_name,
                    COUNT(DISTINCT m.id) as machine_count,
                    SUM(t.coins_in) as total_coins_in,
                    SUM(t.coins_out) as total_coins_out,
                    SUM(t.revenue) as total_revenue,
                    COUNT(t.id) as transaction_count
                FROM branches b
                LEFT JOIN machines m ON b.id = m.branch_id
                LEFT JOIN transactions t ON m.id = t.machine_id
            `;
            
            const params = [];
            let whereConditions = [];

            if (branchId) {
                whereConditions.push("b.id = ?");
                params.push(branchId);
            }

            if (startDate) {
                whereConditions.push("DATE(t.transaction_date) >= DATE(?)");
                params.push(startDate);
            }

            if (endDate) {
                whereConditions.push("DATE(t.transaction_date) <= DATE(?)");
                params.push(endDate);
            }

            if (whereConditions.length > 0) {
                query += " WHERE " + whereConditions.join(" AND ");
            }

            query += " GROUP BY b.id ORDER BY b.id";

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Lấy lịch sử giao dịch với filter nâng cao
    getTransactions(branchId = null, machineId = null, userId = null, startDate = null, endDate = null, sortBy = 'date_desc', limit = 50) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    t.*,
                    m.name as machine_name,
                    m.location,
                    b.name as branch_name,
                    u.full_name as user_name
                FROM transactions t
                JOIN machines m ON t.machine_id = m.id
                JOIN branches b ON t.branch_id = b.id
                LEFT JOIN users u ON t.user_id = u.id
            `;
            
            const params = [];
            let whereConditions = [];
            
            if (branchId) {
                whereConditions.push("t.branch_id = ?");
                params.push(branchId);
            }
            
            if (machineId) {
                whereConditions.push("t.machine_id = ?");
                params.push(machineId);
            }

            if (userId) {
                whereConditions.push("t.user_id = ?");
                params.push(userId);
            }

            if (startDate) {
                whereConditions.push("DATE(t.transaction_date) >= DATE(?)");
                params.push(startDate);
            }

            if (endDate) {
                whereConditions.push("DATE(t.transaction_date) <= DATE(?)");
                params.push(endDate);
            }

            if (whereConditions.length > 0) {
                query += " WHERE " + whereConditions.join(" AND ");
            }
            
            // Sorting
            switch(sortBy) {
                case 'date_asc':
                    query += " ORDER BY t.transaction_date ASC, t.created_at ASC";
                    break;
                case 'revenue_desc':
                    query += " ORDER BY t.revenue DESC, t.created_at DESC";
                    break;
                case 'revenue_asc':
                    query += " ORDER BY t.revenue ASC, t.created_at DESC";
                    break;
                default: // date_desc
                    query += " ORDER BY t.transaction_date DESC, t.created_at DESC";
            }

            query += " LIMIT ?";
            params.push(limit);

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else {
                    // Cũng tính summary
                    this.getTransactionSummary(branchId, machineId, userId, startDate, endDate)
                        .then(summary => {
                            resolve({
                                transactions: rows,
                                summary: summary
                            });
                        })
                        .catch(() => {
                            resolve({
                                transactions: rows,
                                summary: {}
                            });
                        });
                }
            });
        });
    }

    // Lấy summary cho transactions
    getTransactionSummary(branchId = null, machineId = null, userId = null, startDate = null, endDate = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(coins_in) as total_coins_in,
                    SUM(coins_out) as total_coins_out,
                    SUM(revenue) as total_revenue
                FROM transactions t
            `;
            
            const params = [];
            let whereConditions = [];

            if (branchId) {
                whereConditions.push("t.branch_id = ?");
                params.push(branchId);
            }

            if (machineId) {
                whereConditions.push("t.machine_id = ?");
                params.push(machineId);
            }

            if (userId) {
                whereConditions.push("t.user_id = ?");
                params.push(userId);
            }

            if (startDate) {
                whereConditions.push("DATE(t.transaction_date) >= DATE(?)");
                params.push(startDate);
            }

            if (endDate) {
                whereConditions.push("DATE(t.transaction_date) <= DATE(?)");
                params.push(endDate);
            }

            if (whereConditions.length > 0) {
                query += " WHERE " + whereConditions.join(" AND ");
            }

            this.db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Export dữ liệu thành CSV cho Excel
    exportToCSV(branchId = null, startDate = null, endDate = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    t.transaction_date as 'Ngày',
                    b.name as 'Chi Nhánh',
                    m.name as 'Máy',
                    m.location as 'Vị Trí',
                    u.full_name as 'Nhân Viên',
                    t.coins_in as 'Xu Vào',
                    t.coins_out as 'Xu Ra',
                    t.revenue as 'Doanh Thu',
                    t.note as 'Ghi Chú'
                FROM transactions t
                JOIN machines m ON t.machine_id = m.id
                JOIN branches b ON t.branch_id = b.id
                LEFT JOIN users u ON t.user_id = u.id
            `;
            
            const params = [];
            let whereConditions = [];
            
            if (branchId) {
                whereConditions.push("t.branch_id = ?");
                params.push(branchId);
            }
            
            if (startDate) {
                whereConditions.push("DATE(t.transaction_date) >= DATE(?)");
                params.push(startDate);
            }

            if (endDate) {
                whereConditions.push("DATE(t.transaction_date) <= DATE(?)");
                params.push(endDate);
            }

            if (whereConditions.length > 0) {
                query += " WHERE " + whereConditions.join(" AND ");
            }
            
            query += " ORDER BY t.transaction_date DESC, b.name, m.name";

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database; 