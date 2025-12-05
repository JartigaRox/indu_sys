import { Router } from 'express';
import { getCompanies } from '../controllers/companies.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/', verifyToken, getCompanies);

export default router;