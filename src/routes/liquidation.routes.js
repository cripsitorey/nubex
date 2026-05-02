import { Router } from 'express';
import { previewLiquidacion, executeLiquidacion } from '../controllers/liquidationController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Ambos requieren ser ADMIN para controlar cierres de caja
router.use(verifyToken, verifyRole(['ADMIN']));

router.get('/preview/:vendedorId', previewLiquidacion);
router.post('/execute', executeLiquidacion);

export default router;
