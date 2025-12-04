// BE/src/routes/orders.routes.js
import { Router } from 'express';
import { createOrder, getOrders } from '../controllers/orders.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

// Rutas protegidas (Cualquier empleado logueado puede ver y crear pedidos internos)
router.post('/', verifyToken, createOrder);
router.get('/', verifyToken, getOrders);

export default router;