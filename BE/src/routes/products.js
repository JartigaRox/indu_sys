// BE/src/routes/products.js
import { Router } from 'express';
import { createProduct, getProducts, getProductImage } from '../controllers/products.js';
import { verifyToken } from '../middlewares/auth.js';
import multer from 'multer';

const router = Router();

// Configuración simple de Multer para guardar en memoria RAM temporalmente
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rutas
router.get('/', verifyToken, getProducts); // Ver lista (Privado)
router.get('/image/:id', getProductImage); // Ver imagen (Público o Privado según prefieras, útil para <img src="...">)

// IMPORTANTE: 'imagen' es el nombre del campo que debes usar en Postman/Frontend
router.post('/', verifyToken, upload.single('imagen'), createProduct); 

export default router;