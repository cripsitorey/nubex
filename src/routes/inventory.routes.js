import { Router } from 'express';
import { assignVapesToVendedor } from '../controllers/inventoryController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Solo los ADMIN pueden asignar inventario central a los vendedores
router.use(verifyToken, verifyRole(['ADMIN']));
router.post('/assign', assignVapesToVendedor);

export default router;
