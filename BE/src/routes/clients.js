// BE/src/routes/clients.routes.js
import { Router } from 'express';
import { createClient, getClients,getClientById,updateClient } from '../controllers/clients.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', verifyToken, getClients);
router.post('/', verifyToken, createClient); // Solo verifyToken (Admin y Operadores pueden crear)

router.get('/:id', verifyToken, getClientById); // Obtener datos para editar
router.put('/:id', verifyToken, updateClient);

export default router;