import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,

  ssl: {
    rejectUnauthorized: false,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const testDatabaseConnection = async () => {
  let connection;

  try {
    connection = await pool.getConnection();

    await connection.query("SELECT 1");

    console.log("MySQL database connected successfully.");

    return true;
  } catch (error) {
    console.error("MySQL database connection failed.");
    console.error("Error:", error.message);

    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export default pool;