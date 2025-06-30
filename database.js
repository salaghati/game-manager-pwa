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

    // Lấy doanh thu theo chi nhánh, máy và thời gian
    async getRevenue(branchId = null, machineId = null, startDate = null, endDate = null) {
        let query, params = [], whereConditions = [], transactionFilters = [], paramIndex = 1;
        
        if (this.isPostgres) {
            query = `
                SELECT 
                    b.name as branch_name,
                    m.name as machine_name,
                    m.location,
                    m.branch_id,
                    m.id as machine_id,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL THEN t.coins_in ELSE 0 END), 0) as total_coins_in,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL THEN t.coins_out ELSE 0 END), 0) as total_coins_out,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL THEN t.revenue ELSE 0 END), 0) as total_revenue,
                    COUNT(t.id) as transaction_count
                FROM machines m
                LEFT JOIN transactions t ON m.id = t.machine_id
                JOIN branches b ON m.branch_id = b.id
            `;
            
            // Machine/branch filters go in main WHERE
            if (branchId) {
                whereConditions.push(`m.branch_id = $${paramIndex}`);
                params.push(branchId);
                paramIndex++;
            }

            if (machineId) {
                whereConditions.push(`m.id = $${paramIndex}`);
                params.push(machineId);
                paramIndex++;
            }

            // Date filters only apply to transactions in the LEFT JOIN  
            if (startDate) {
                transactionFilters.push(`t.transaction_date::date >= $${paramIndex}::date`);
                params.push(startDate);
                paramIndex++;
            }

            if (endDate) {
                transactionFilters.push(`t.transaction_date::date <= $${paramIndex}::date`);
                params.push(endDate);
                paramIndex++;
            }

            // Apply filters: machine/branch filters always apply, date filters only when transactions exist
            const allConditions = [...whereConditions];
            if (transactionFilters.length > 0) {
                allConditions.push("(t.id IS NULL OR (" + transactionFilters.join(" AND ") + "))");
            }
            
            if (allConditions.length > 0) {
                query += " WHERE " + allConditions.join(" AND ");
            }

            query += " GROUP BY m.id, b.id, b.name, m.name, m.location, m.branch_id ORDER BY b.id, m.id";

            console.log('🔍 PostgreSQL getRevenue query:', query);
            console.log('🔍 Query params:', params);

            try {
                const result = await this.pool.query(query, params);
                console.log('🔍 Query result count:', result.rows.length);
                if (result.rows.length > 0) {
                    console.log('🔍 First result row:', result.rows[0]);
                }
                return result.rows;
            } catch (error) {
                console.error('Error in getRevenue (PostgreSQL):', error);
                throw error;
            }
        } else {
            // SQLite version
            query = `
                SELECT 
                    b.name as branch_name,
                    m.name as machine_name,
                    m.location,
                    m.branch_id,
                    m.id as machine_id,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL THEN t.coins_in ELSE 0 END), 0) as total_coins_in,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL THEN t.coins_out ELSE 0 END), 0) as total_coins_out,
                    COALESCE(SUM(CASE WHEN t.id IS NOT NULL THEN t.revenue ELSE 0 END), 0) as total_revenue,
                    COUNT(t.id) as transaction_count
                FROM machines m
                LEFT JOIN transactions t ON m.id = t.machine_id
                JOIN branches b ON m.branch_id = b.id
            `;
            
            // Machine/branch filters go in main WHERE
            if (branchId) {
                whereConditions.push("m.branch_id = ?");
                params.push(branchId);
            }

            if (machineId) {
                whereConditions.push("m.id = ?");
                params.push(machineId);
            }

            // Date filters only apply to transactions in the LEFT JOIN
            let transactionFilters = [];
            if (startDate) {
                transactionFilters.push("DATE(t.transaction_date) >= DATE(?)");
                params.push(startDate);
            }

            if (endDate) {
                transactionFilters.push("DATE(t.transaction_date) <= DATE(?)");
                params.push(endDate);
            }

            // Apply filters: machine/branch filters always apply, date filters only when transactions exist
            const allConditions = [...whereConditions];
            if (transactionFilters.length > 0) {
                allConditions.push("(t.id IS NULL OR (" + transactionFilters.join(" AND ") + "))");
            }
            
            if (allConditions.length > 0) {
                query += " WHERE " + allConditions.join(" AND ");
            }

            query += " GROUP BY m.id, b.id, b.name, m.name, m.location, m.branch_id ORDER BY b.id, m.id";

            console.log('🔍 SQLite getRevenue query:', query);
            console.log('🔍 Query params:', params);

            return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                    if (err) {
                        console.error('Error in getRevenue (SQLite):', err);
                        reject(err);
                    } else {
                        console.log('🔍 Query result count:', rows.length);
                        if (rows.length > 0) {
                            console.log('🔍 First result row:', rows[0]);
                        }
                        resolve(rows);
                    }
            });
        });
        }
    }

    // Lấy tổng doanh thu theo chi nhánh
    async getBranchRevenue(branchId = null, startDate = null, endDate = null) {
        let query, params = [], whereConditions = [], paramIndex = 1;
        
        if (this.isPostgres) {
            query = `
                SELECT 
                    b.id as branch_id,
                    b.name as branch_name,
                    b.address,
                    b.manager_name,
                    COALESCE(SUM(t.coins_in), 0) as total_coins_in,
                    COALESCE(SUM(t.coins_out), 0) as total_coins_out,
                    COALESCE(SUM(t.revenue), 0) as total_revenue,
                    COUNT(DISTINCT m.id) as machine_count,
                    COUNT(t.id) as transaction_count
                FROM branches b
                LEFT JOIN machines m ON b.id = m.branch_id
                LEFT JOIN transactions t ON m.id = t.machine_id
            `;
            
            if (branchId) {
                whereConditions.push(`b.id = $${paramIndex}`);
                params.push(branchId);
                paramIndex++;
            }

            if (startDate) {
                whereConditions.push(`t.transaction_date::date >= $${paramIndex}::date`);
                params.push(startDate);
                paramIndex++;
            }

            if (endDate) {
                whereConditions.push(`t.transaction_date::date <= $${paramIndex}::date`);
                params.push(endDate);
                paramIndex++;
            }

            if (whereConditions.length > 0) {
                query += " WHERE " + whereConditions.join(" AND ");
            }

            query += " GROUP BY b.id, b.name, b.address, b.manager_name ORDER BY b.id";

            try {
                const result = await this.pool.query(query, params);
                return result.rows;
            } catch (error) {
                console.error('Error in getBranchRevenue (PostgreSQL):', error);
                throw error;
            }
        } else {
            // SQLite version
            query = `
                SELECT 
                    b.id as branch_id,
                    b.name as branch_name,
                    b.address,
                    b.manager_name,
                    COALESCE(SUM(t.coins_in), 0) as total_coins_in,
                    COALESCE(SUM(t.coins_out), 0) as total_coins_out,
                    COALESCE(SUM(t.revenue), 0) as total_revenue,
                    COUNT(DISTINCT m.id) as machine_count,
                    COUNT(t.id) as transaction_count
                FROM branches b
                LEFT JOIN machines m ON b.id = m.branch_id
                LEFT JOIN transactions t ON m.id = t.machine_id
            `;

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

            return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                    if (err) {
                        console.error('Error in getBranchRevenue (SQLite):', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
            });
        });
        }
    }

    // Lấy lịch sử giao dịch với filter nâng cao
    getTransactions(branchId = null, machineId = null, userId = null, startDate = null, endDate = null, sortBy = 'date_desc', limit = 50) {
        if (this.isPostgres) {
            return this.getTransactionsPostgres(branchId, machineId, userId, startDate, endDate, sortBy, limit);
        } else {
            return this.getTransactionsSQLite(branchId, machineId, userId, startDate, endDate, sortBy, limit);
        }
    }

    async getTransactionsPostgres(branchId = null, machineId = null, userId = null, startDate = null, endDate = null, sortBy = 'date_desc', limit = 50) {
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
        let paramIndex = 1;
        
        if (branchId) {
            whereConditions.push(`t.branch_id = $${paramIndex}`);
            params.push(branchId);
            paramIndex++;
        }
        
        if (machineId) {
            whereConditions.push(`t.machine_id = $${paramIndex}`);
            params.push(machineId);
            paramIndex++;
        }

        if (userId) {
            whereConditions.push(`t.user_id = $${paramIndex}`);
            params.push(userId);
            paramIndex++;
        }

        if (startDate) {
            whereConditions.push(`t.transaction_date::date >= $${paramIndex}::date`);
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereConditions.push(`t.transaction_date::date <= $${paramIndex}::date`);
            params.push(endDate);
            paramIndex++;
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

        query += ` LIMIT $${paramIndex}`;
        params.push(limit);

        try {
            const result = await this.pool.query(query, params);
            const summary = await this.getTransactionSummary(branchId, machineId, userId, startDate, endDate);
            return {
                transactions: result.rows,
                summary: summary
            };
        } catch (error) {
            console.error('Error getting transactions:', error);
            return { transactions: [], summary: {} };
        }
    }

    getTransactionsSQLite(branchId = null, machineId = null, userId = null, startDate = null, endDate = null, sortBy = 'date_desc', limit = 50) {
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
    async getTransactionSummary(branchId = null, machineId = null, userId = null, startDate = null, endDate = null) {
        let query, params = [], whereConditions = [], paramIndex = 1;
        
        if (this.isPostgres) {
            query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(coins_in), 0) as total_coins_in,
                    COALESCE(SUM(coins_out), 0) as total_coins_out,
                    COALESCE(SUM(revenue), 0) as total_revenue
                FROM transactions t
            `;
            
            if (branchId) {
                whereConditions.push(`t.branch_id = $${paramIndex}`);
                params.push(branchId);
                paramIndex++;
            }

            if (machineId) {
                whereConditions.push(`t.machine_id = $${paramIndex}`);
                params.push(machineId);
                paramIndex++;
            }

            if (userId) {
                whereConditions.push(`t.user_id = $${paramIndex}`);
                params.push(userId);
                paramIndex++;
            }

            if (startDate) {
                whereConditions.push(`t.transaction_date::date >= $${paramIndex}::date`);
                params.push(startDate);
                paramIndex++;
            }

            if (endDate) {
                whereConditions.push(`t.transaction_date::date <= $${paramIndex}::date`);
                params.push(endDate);
                paramIndex++;
            }

            if (whereConditions.length > 0) {
                query += " WHERE " + whereConditions.join(" AND ");
            }

            try {
                const result = await this.pool.query(query, params);
                return result.rows[0];
            } catch (error) {
                console.error('Error in getTransactionSummary (PostgreSQL):', error);
                throw error;
            }
        } else {
            // SQLite version
            query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(coins_in), 0) as total_coins_in,
                    COALESCE(SUM(coins_out), 0) as total_coins_out,
                    COALESCE(SUM(revenue), 0) as total_revenue
                FROM transactions t
            `;

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

            return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                    if (err) {
                        console.error('Error in getTransactionSummary (SQLite):', err);
                        reject(err);
                    } else {
                        resolve(row);
                    }
            });
        });
        }
    }

    // Reset transactions data (for managers/admin)
    async resetTransactions(branchId = null) {
        if (this.isPostgres) {
            let query = 'DELETE FROM transactions';
            let params = [];
            
            if (branchId) {
                query += ' WHERE branch_id = $1';
                params.push(branchId);
            }
            
            try {
                const result = await this.pool.query(query, params);
                return { deletedCount: result.rowCount };
            } catch (error) {
                console.error('Error resetting transactions (PostgreSQL):', error);
                throw error;
            }
        } else {
            // SQLite version
            let query = 'DELETE FROM transactions';
            let params = [];

            if (branchId) {
                query += ' WHERE branch_id = ?';
                params.push(branchId);
            }
            
            return new Promise((resolve, reject) => {
                this.db.run(query, params, function(err) {
                    if (err) {
                        console.error('Error resetting transactions (SQLite):', err);
                        reject(err);
                    } else {
                        resolve({ deletedCount: this.changes });
                    }
            });
        });
        }
    }

    close() {
        if (this.isPostgres) {
            this.pool.end();
        } else {
        this.db.close();
        }
    }

    // Lấy dữ liệu tổng hợp cho Dashboard
    async getDashboardData(branchId = null, startDate = null, endDate = null) {
        if (this.isPostgres) {
            return this.getDashboardDataPostgres(branchId, startDate, endDate);
        } else {
            return this.getDashboardDataSQLite(branchId, startDate, endDate);
        }
    }

    async getDashboardDataPostgres(branchId = null, startDate = null, endDate = null) {
        const client = await this.pool.connect();
        try {
            const params = [];
            let dateFilter = '';
            if (startDate && endDate) {
                params.push(startDate, endDate);
                dateFilter = `AND t.transaction_date BETWEEN $${params.length - 1} AND $${params.length}`;
            }

            let branchFilter = '';
            if (branchId) {
                params.push(branchId);
                branchFilter = `WHERE t.branch_id = $${params.length}`;
            }
            
            let machineBranchFilter = branchId ? `WHERE branch_id = $${params.length}` : '';


            // Query 1: Lấy các chỉ số tổng quan (doanh thu, xu vào/ra)
            const statsQuery = `
                SELECT 
                    COALESCE(SUM(t.revenue), 0) AS total_revenue,
                    COALESCE(SUM(t.coins_in), 0) AS total_coins_in,
                    COALESCE(SUM(t.coins_out), 0) AS total_coins_out,
                    COUNT(DISTINCT t.machine_id) AS total_machines_with_transactions
                FROM transactions t
                ${branchFilter.replace('t.', '')} ${dateFilter.replace('t.', '')};
            `;
            const statsResult = await client.query(statsQuery, params);

            // Query 2: Lấy tổng số máy của chi nhánh (không phụ thuộc ngày)
            const totalMachinesQuery = `
                SELECT COUNT(*) AS total_machines FROM machines ${machineBranchFilter.replace('t.', 'm.')};
            `;
            const totalMachinesResult = await client.query(totalMachinesQuery, branchId ? [branchId] : []);
            
            // Query 3: Lấy doanh thu chi tiết theo từng máy
            const machinesQuery = `
                SELECT
                    m.id,
                    m.name,
                    m.location,
                    b.name as branch_name,
                    COALESCE(SUM(t.revenue), 0) as total_revenue,
                    COALESCE(SUM(t.coins_in), 0) as total_coins_in,
                    COALESCE(SUM(t.coins_out), 0) as total_coins_out,
                    COUNT(t.id) as transaction_count
                FROM machines m
                LEFT JOIN transactions t ON m.id = t.machine_id ${dateFilter}
                JOIN branches b ON m.branch_id = b.id
                ${branchId ? `WHERE m.branch_id = $1` : ''}
                GROUP BY m.id, b.name
                ORDER BY total_revenue DESC;
            `;
            const machinesResult = await client.query(machinesQuery, branchId ? [branchId] : []);

            return {
                ...statsResult.rows[0],
                total_machines: totalMachinesResult.rows[0].total_machines,
                machines: machinesResult.rows
            };
        } finally {
            client.release();
        }
    }

    // Khởi tạo dữ liệu mẫu cho SQLite
    async initSampleDataSQLite() {
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
}

module.exports = Database; 