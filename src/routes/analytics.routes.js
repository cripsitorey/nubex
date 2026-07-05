import { Router } from 'express';
import { getDashboard, getVentasPorPeriodo } from '../controllers/analyticsController.js';
import { requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/dashboard', requireAdmin, getDashboard);
router.get('/ventas-por-periodo', requireAdmin, getVentasPorPeriodo);

export default router;
