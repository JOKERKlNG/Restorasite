// Database connection and initialization using SQLite
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file location
const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'restora.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database connection
let db;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better concurrency
} catch (error) {
  console.error('Failed to connect to database:', error);
  throw error;
}

// Initialize database schema
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      avatar_url TEXT,
      favorites TEXT, -- JSON array of favorite menu item IDs
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Menu items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      category TEXT DEFAULT 'Specials',
      description TEXT,
      available INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Reservations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      user_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      reviewer_name TEXT NOT NULL,
      text TEXT NOT NULL,
      user_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (item_id) REFERENCES menu(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      items TEXT NOT NULL, -- JSON array of ordered items
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Sales/Transactions table (for analytics)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      item_id TEXT,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (item_id) REFERENCES menu(id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON reviews(item_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
  `);

  // Insert default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@gmail.com');
  if (!adminExists) {
    const createId = () => `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(createId(), 'admin@gmail.com', '12345678', 'Admin', 'admin');
  }

  // Insert default menu items if menu is empty
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu').get();
  if (menuCount.count === 0) {
    const createId = () => `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const defaultMenu = [
      {
        id: createId(),
        name: "Coq au Vin",
        price: 850,
        image: "https://raw.githubusercontent.com/JOKERKlNG/Restora/refs/heads/main/French%20Food%201.png",
        category: "Main Course",
      },
      {
        id: createId(),
        name: "Bouillabaisse",
        price: 1200,
        image: "https://raw.githubusercontent.com/JOKERKlNG/Restora/refs/heads/main/French%20Food%202.png",
        category: "Main Course",
      },
      {
        id: createId(),
        name: "Ratatouille",
        price: 650,
        image: "https://raw.githubusercontent.com/JOKERKlNG/Restora/refs/heads/main/French%20Food%203.png",
        category: "Vegetarian",
      },
      {
        id: createId(),
        name: "Escargot",
        price: 750,
        image: "https://raw.githubusercontent.com/JOKERKlNG/Restora/refs/heads/main/French%20Food%204.png",
        category: "Appetizer",
      },
      {
        id: createId(),
        name: "Crêpes",
        price: 450,
        image: "https://raw.githubusercontent.com/JOKERKlNG/Restora/refs/heads/main/French%20Food%205.png",
        category: "Dessert",
      },
      {
        id: createId(),
        name: "French Onion Soup",
        price: 420,
        image: "https://raw.githubusercontent.com/JOKERKlNG/Restora/refs/heads/main/French%20Food%206.png",
        category: "Soup",
      },
      {
        id: createId(),
        name: "Beef Bourguignon",
        price: 1100,
        image: "https://raw.githubusercontent.com/JOKERKlNG/Restora/refs/heads/main/French%20Food%207.png",
        category: "Main Course",
      },
    ];

    const insertMenu = db.prepare(`
      INSERT INTO menu (id, name, price, image, category)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertMenu.run(item.id, item.name, item.price, item.image, item.category);
      }
    });

    insertMany(defaultMenu);
  }

  console.log('Database initialized successfully');
}

// Initialize on module load
initializeDatabase();

// Helper function to create ID
function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

module.exports = {
  db,
  createId,
  initializeDatabase,
};

