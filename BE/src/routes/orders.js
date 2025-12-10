import { Router } from 'express';
// Importamos las funciones que ya tienes en tu controlador
import { getOrders, getOrderById, getOrderOptions, createOrder, updateOrder, getFullOrderById } from '../controllers/orders.js';
import { verifyToken } from '../middlewares/auth.js';
import multer from 'multer';
import fs from 'fs';

const router = Router();

// --- CONFIGURACIÓN PARA SUBIR ARCHIVOS (MULTER) ---
// Esto es necesario porque el formulario envía archivos PDF
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = 'uploads/orders/';
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
        cb(null, path);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// --- RUTAS ---

// 1. Listado de Órdenes (Solo cotizaciones aceptadas)
router.get('/', verifyToken, getOrders);

// 2. Opciones para los selects (Estados, métodos de pago, etc.) - DEBE IR ANTES DE /:id
router.get('/options', verifyToken, getOrderOptions);

// 3. Orden completa por ID (para edición) - DEBE IR ANTES de /:id genérico
router.get('/full/:id', verifyToken, getFullOrderById);

// 4. Detalle de una orden específica
router.get('/:id', verifyToken, getOrderById);

// 4. Crear Orden
router.post('/', verifyToken, upload.fields([
    { name: 'docAnticipo', maxCount: 1 }, 
    { name: 'docComplemento', maxCount: 1 }
]), createOrder);

// 5. Actualizar Orden
router.put('/:id', verifyToken, upload.fields([
    { name: 'docAnticipo', maxCount: 1 }, 
    { name: 'docComplemento', maxCount: 1 }
]), updateOrder);

export default router;