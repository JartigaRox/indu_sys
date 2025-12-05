import { Router } from 'express';
// 1. IMPORTANTE: Asegúrate de importar getCategories y getSubcategories
import { 
    createProduct, 
    getProducts, 
    getProductImage, 
    getCategories, 
    getSubcategories,
    getProduct,
    updateProduct,
    deleteProduct
} from '../controllers/products.js';
import { verifyToken, isSudo } from '../middlewares/auth.js';
import multer from 'multer';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/image/:id', getProductImage);
router.get('/categories', verifyToken, getCategories);
router.get('/subcategories/:catId', verifyToken, getSubcategories);

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProduct);
router.post('/', verifyToken, isSudo, upload.single('imagen'), createProduct);
router.put('/:id', verifyToken, isSudo, upload.single('imagen'), updateProduct); // <--- NUEVO
router.delete('/:id', verifyToken, isSudo, deleteProduct);

export default router;