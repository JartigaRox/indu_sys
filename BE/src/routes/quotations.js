// BE/src/routes/quotations.routes.js
import { Router } from 'express';
import { createQuote, getQuotes, getQuoteById, getNextQuoteNumber, updateQuoteStatus} from '../controllers/quotations.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas protegidas (solo usuarios logueados pueden cotizar)
router.post('/', verifyToken, createQuote);
router.get('/', verifyToken, getQuotes);
router.get('/next-number', verifyToken, getNextQuoteNumber);
router.get('/:id', verifyToken, getQuoteById);
router.patch('/:id/status', verifyToken, updateQuoteStatus);

export default router;