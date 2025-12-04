// BE/src/routes/clients.routes.js
import { Router } from 'express';
import { createClient, getClients } from '../controllers/clients.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', verifyToken, getClients);
router.post('/', verifyToken, createClient); // Solo verifyToken (Admin y Operadores pueden crear)

export default router;