import { Router } from 'express';
import multer from 'multer';
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
  getRoles,
  getUserSignature,
  getSellers,
  forgotPassword, // <--- NUEVO
  resetPassword   // <--- NUEVO
} from '../controllers/auth.js';
import { verifyToken, isSudo } from '../middlewares/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rutas Públicas
router.post('/login', login);
router.post('/forgot-password', forgotPassword); // <--- NUEVA RUTA
router.post('/reset-password/:token', resetPassword); // <--- NUEVA RUTA

// Ruta para refrescar token (puede recibir token expirado)
router.post('/refresh-token', refreshToken);

// Rutas Privadas
router.post('/register', verifyToken, isSudo, upload.single('firma'), register);

// Gestión de usuarios (solo para sudo)
router.get('/users', verifyToken, isSudo, getUsers);
router.get('/users/:id', verifyToken, isSudo, getUserById);
router.put('/users/:id', verifyToken, isSudo, upload.single('firma'), updateUser);
router.delete('/users/:id', verifyToken, isSudo, deleteUser);

// Endpoint público para firmas (necesario para mostrar en PDFs)
router.get('/users/:id/signature', getUserSignature);

// Catálogos
router.get('/seller-types', verifyToken, getSellerTypes);
router.get('/roles', verifyToken, getRoles);
router.get('/sellers', verifyToken, getSellers);

export default router;