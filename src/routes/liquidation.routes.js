import { Router } from 'express';
import { getLiquidaciones, createLiquidacion, cerrarLiquidacion } from '../controllers/liquidationController.js';
import { requireAdmin, requireVendedor } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireVendedor, getLiquidaciones);
router.post('/', requireAdmin, createLiquidacion);
router.patch('/:id/cerrar', requireAdmin, cerrarLiquidacion);

export default router;
