// BE/src/db.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbSettings = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // Usar true si estás en Azure
    trustServerCertificate: true, // Cambiar a false en producción con certificados reales
  },
};

export async function getConnection() {
  try {
    const pool = await sql.connect(dbSettings);
    return pool;
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error);
  }
}

export { sql };