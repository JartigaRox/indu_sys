// BE/src/routes/auth.routes.js
import { Router } from 'express';
import { login, register } from '../controllers/auth.js';
import { verifyToken, isSudo } from '../middlewares/auth.js';

const router = Router();

// Rutas Públicas
router.post('/login', login);

// Rutas Privadas (Solo un Sudo puede crear otros usuarios por seguridad)
router.post('/register', verifyToken, isSudo, register);

export default router;