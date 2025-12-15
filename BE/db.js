import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL usa "Pool" para manejar conexiones de forma eficiente
// Railway proporciona la variable DATABASE_URL automáticamente
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Función auxiliar para mantener compatibilidad
export const getConnection = async () => {
  return pool; 
};

// Exportamos 'pool' como 'sql' para facilitar la migración de imports
export { pool as sql };