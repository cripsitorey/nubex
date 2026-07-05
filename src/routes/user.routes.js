import { Router } from 'express';
import { list, getById, create, update, deactivate, searchClientes } from '../controllers/userController.js';
import { requireAdmin, requireAuth, requireVendedor } from '../middlewares/auth.js';

const router = Router();

router.get('/search', requireVendedor, searchClientes);
router.get('/', requireAdmin, list);
router.get('/:id', requireAuth, getById);
router.post('/', requireAdmin, create);
router.patch('/:id', requireAuth, update);
router.delete('/:id', requireAdmin, deactivate);

export default router;
