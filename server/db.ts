import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'marmitex.db');
const db = new Database(dbPath);

// Initialize Database Schema
export function initDb() {
  console.log('Initializing database at:', dbPath);
  
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'ALUNO')),
      turma TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Menus Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      dia_semana TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('RASCUNHO', 'PUBLICADO', 'VAZIO')),
      pdf_url TEXT,
      pdf_nome TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Menu Options Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_options (
      id TEXT PRIMARY KEY,
      menu_id TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('REGULAR', 'VEGETARIANO')),
      nome_prato TEXT NOT NULL,
      descricao TEXT,
      alergenos TEXT,
      image_url TEXT,
      FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
    )
  `);

  // Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      menu_option_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('ATIVO', 'CANCELADO')),
      numero_ticket TEXT,
      motivo_admin TEXT,
      created_by TEXT NOT NULL CHECK(created_by IN ('ADMIN', 'ALUNO')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (menu_option_id) REFERENCES menu_options(id)
    )
  `);

  // Feedbacks Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  // Admin Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    )
  `);

  // Seed Admin User if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@escola.com');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin-uuid', 'Administrador', 'admin@escola.com', hashedPassword, 'ADMIN');
    console.log('Admin user seeded: admin@escola.com / 123456');
  }
}

export default db;
