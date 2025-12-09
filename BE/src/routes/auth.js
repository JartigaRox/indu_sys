import { Router } from 'express';
// Importamos las funciones necesarias
import { 
  login, 
  register, 
  getSellerTypes, 
  refreshToken,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getRoles
} from '../controllers/auth.js';
import { verifyToken, isSudo } from '../middlewares/auth.js';

const router = Router();

// Rutas Públicas
router.post('/login', login);

// Ruta para refrescar token (puede recibir token expirado)
router.post('/refresh-token', refreshToken);

// Rutas Privadas
router.post('/register', verifyToken, isSudo, register);

// Gestión de usuarios (solo para sudo)
router.get('/users', verifyToken, isSudo, getUsers);
router.get('/users/:id', verifyToken, isSudo, getUserById);
router.put('/users/:id', verifyToken, isSudo, updateUser);
router.delete('/users/:id', verifyToken, isSudo, deleteUser);

// Catálogos
router.get('/seller-types', verifyToken, getSellerTypes);
router.get('/roles', verifyToken, getRoles);

export default router;