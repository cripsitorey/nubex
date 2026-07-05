import { Router } from 'express';
import { getConfig, createConfig, getLogros, reclamarLogro } from '../controllers/fidelityController.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/config', requireAuth, getConfig);
router.post('/config', requireAdmin, createConfig);
router.get('/logros', requireAuth, getLogros);
router.get('/logros/:clienteId', requireAdmin, getLogros);
router.patch('/logros/:id/reclamar', requireAuth, reclamarLogro);

export default router;
