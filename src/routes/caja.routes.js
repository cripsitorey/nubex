import { Router } from 'express';
import { getMovimientos, createMovimiento } from '../controllers/cajaController.js';
import { requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAdmin, getMovimientos);
router.post('/', requireAdmin, createMovimiento);

export default router;
