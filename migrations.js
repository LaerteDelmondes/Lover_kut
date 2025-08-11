const Database = require("better-sqlite3");
const db = new Database("db.sqlite");

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  avatar TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS scraps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  content TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)
`).run();

console.log("Migrações executadas com sucesso!");
