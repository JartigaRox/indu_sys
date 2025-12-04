// BE/src/routes/locations.routes.js
import { Router } from 'express';
import { getDepartamentos, getMunicipiosByDept, getDistritosByMun } from '../controllers/locations.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/departamentos', verifyToken, getDepartamentos);
router.get('/municipios/:departamentoId', verifyToken, getMunicipiosByDept);
router.get('/distritos/:municipioId', verifyToken, getDistritosByMun);

export default router;