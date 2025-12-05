import { Router } from 'express';
// 1. IMPORTANTE: Asegúrate de importar getCategories y getSubcategories
import { 
    createProduct, 
    getProducts, 
    getProductImage, 
    getCategories, 
    getSubcategories 
} from '../controllers/products.js';
import { verifyToken, isSudo } from '../middlewares/auth.js';
import multer from 'multer';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rutas Públicas
router.get('/image/:id', getProductImage);

// 2. IMPORTANTE: Estas son las rutas que cargan los combos
router.get('/categories', verifyToken, getCategories);
router.get('/subcategories/:catId', verifyToken, getSubcategories);

// Rutas Principales
router.get('/', verifyToken, getProducts);
router.post('/', verifyToken, isSudo, upload.single('imagen'), createProduct);

export default router;