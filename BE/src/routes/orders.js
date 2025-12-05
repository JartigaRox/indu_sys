import { Router } from 'express';
import { getOrders, getOrderById } from '../controllers/orders.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', verifyToken, getOrders);
router.get('/:id', verifyToken, getOrderById);

export default router;