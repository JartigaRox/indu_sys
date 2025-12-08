import { Router } from 'express';
// Importamos la nueva función getSellerTypes y refreshToken
import { login, register, getSellerTypes, refreshToken } from '../controllers/auth.js';
import { verifyToken, isSudo } from '../middlewares/auth.js';

const router = Router();

// Rutas Públicas
router.post('/login', login);

// Ruta para refrescar token (puede recibir token expirado)
router.post('/refresh-token', refreshToken);

// Rutas Privadas
router.post('/register', verifyToken, isSudo, register);

// --- NUEVA RUTA (Para llenar el combobox del frontend) ---
router.get('/seller-types', verifyToken, getSellerTypes);

export default router;