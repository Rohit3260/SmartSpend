const mysql = require("mysql2/promise");
require("dotenv").config();

// local setup (for development)
// const db = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME || "smartspend",
//   port: process.env.DB_PORT || 3306,
  
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   timezone: "Z",
// });

// production (Railway using DATABASE_URL)
const db = mysql.createPool({
  uri: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const conn = await db.getConnection();
    console.log("Database connected");
    conn.release();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
}

testConnection();

module.exports = db;
