import { Router } from 'express';
import { getInventario, asignar, devolver, setComisionVendedor } from '../controllers/inventoryController.js';
import { requireAdmin, requireVendedor } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireVendedor, getInventario);
router.post('/asignar', requireAdmin, asignar);
router.post('/devolver', requireAdmin, devolver);
router.post('/comision', requireAdmin, setComisionVendedor);

export default router;
