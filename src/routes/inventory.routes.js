import { Router } from 'express';
import { assignVapesToVendedor, getInventory, updateAssignedInventory, removeAssignedInventory } from '../controllers/inventoryController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas para consultar inventario (ADMIN ve todo, VENDEDOR ve lo suyo)
router.use(verifyToken);
router.get('/', verifyRole(['ADMIN', 'VENDEDOR']), getInventory);

// Rutas de administración
router.post('/assign', verifyRole(['ADMIN']), assignVapesToVendedor);
router.put('/:id', verifyRole(['ADMIN']), updateAssignedInventory);
router.delete('/:id', verifyRole(['ADMIN']), removeAssignedInventory);

export default router;
