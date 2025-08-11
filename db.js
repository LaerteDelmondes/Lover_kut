// db.js
const Database = require('better-sqlite3');
const db = new Database('data.db');

module.exports = db;
