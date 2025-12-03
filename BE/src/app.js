import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(bodyParser.json());
app.use(cors());

// // Rutas
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/customers", customerRoutes);
// app.use("/api/sales", salesRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "El servidor está en funcionamiento" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

export default app;