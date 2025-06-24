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

    // Khởi tạo PostgreSQL
    async initPostgres() {
        try {
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
            console.error('❌ Error initializing PostgreSQL:', error);
        }
    }

    // Khởi tạo SQLite (giữ nguyên code cũ)
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

    // Khởi tạo dữ liệu mẫu cho SQLite (giữ nguyên)
    initSampleData() {
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

    // Wrapper methods để handle cả PostgreSQL và SQLite
    async getAllBranches() {
        if (this.isPostgres) {
            const result = await this.pool.query("SELECT * FROM branches ORDER BY id");
            return result.rows;
        } else {
            return new Promise((resolve, reject) => {
                this.db.all("SELECT * FROM branches ORDER BY id", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    }

    async getUsers(branchId = null) {
        const query = "SELECT id, username, full_name, role, branch_id FROM users" + 
                     (branchId ? " WHERE branch_id = $1" : "") + " ORDER BY full_name";
        
        if (this.isPostgres) {
            const result = await this.pool.query(query, branchId ? [branchId] : []);
            return result.rows;
        } else {
            return new Promise((resolve, reject) => {
                const sqliteQuery = query.replace('$1', '?');
                this.db.all(sqliteQuery, branchId ? [branchId] : [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    }

    async getAllMachines(branchId = null) {
        const query = `
            SELECT m.*, b.name as branch_name 
            FROM machines m
            JOIN branches b ON m.branch_id = b.id
        ` + (branchId ? " WHERE m.branch_id = $1" : "") + " ORDER BY m.branch_id, m.id";
        
        if (this.isPostgres) {
            const result = await this.pool.query(query, branchId ? [branchId] : []);
            return result.rows;
        } else {
            return new Promise((resolve, reject) => {
                const sqliteQuery = query.replace('$1', '?');
                this.db.all(sqliteQuery, branchId ? [branchId] : [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    }

    // Xác thực người dùng (đã fix bug - so sánh với password trong database)
    async authenticateUser(username, password) {
        if (this.isPostgres) {
            const result = await this.pool.query(`
                SELECT u.*, b.name as branch_name 
                FROM users u 
                LEFT JOIN branches b ON u.branch_id = b.id 
                WHERE u.username = $1
            `, [username]);
            
            const user = result.rows[0];
            if (!user) return null;
            
            // So sánh với password trong database
            if (password === user.password) {
                return user;
            } else {
                return null;
            }
        } else {
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
                        // So sánh với password trong database
                        if (password === row.password) {
                            resolve(row);
                        } else {
                            resolve(null);
                        }
                    }
                });
            });
        }
    }

    // Thêm giao dịch mới
    async addTransaction(machineId, branchId, userId, coinsIn, coinsOut, note = '', transactionDate = null) {
        const revenue = coinsIn - coinsOut;
        const txDate = transactionDate || new Date().toISOString().split('T')[0];
        
        if (this.isPostgres) {
            const result = await this.pool.query(
                "INSERT INTO transactions (machine_id, branch_id, user_id, coins_in, coins_out, revenue, note, transaction_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
                [machineId, branchId, userId, coinsIn, coinsOut, revenue, note, txDate]
            );
            return { id: result.rows[0].id, revenue };
        } else {
            return new Promise((resolve, reject) => {
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
    }

    // Các methods khác cho revenue, transactions, etc. (simplified để tiết kiệm chỗ)
    close() {
        if (this.isPostgres) {
            this.pool.end();
        } else {
            this.db.close();
        }
    }
}

module.exports = Database; 