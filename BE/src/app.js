// BE/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // Importante para leer el .env
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import clientRoutes from './routes/clients.js';
import locationRoutes from './routes/locations.js';
import quotationRoutes from './routes/quotations.js';
import ordersRoutes from './routes/orders.js';
import companiesRoutes from './routes/companies.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Inicializar configuración
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(express.json()); // Express ahora trae su propio parser, ya no necesitas body-parser aparte
app.use(cors());



// Servir archivos estáticos (para acceder a PDFs subidos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Usar Rutas
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/companies", companiesRoutes);

// Health check y Prueba de Base de Datos
import { getConnection, sql } from '../db.js';

app.get("/health", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT 1 as val');
    res.status(200).json({ 
      status: "OK", 
      message: "Servidor corriendo y Base de Datos conectada", 
      dbCheck: result.recordset[0].val 
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Error conectando a la BD", error: error.message });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

export default app;