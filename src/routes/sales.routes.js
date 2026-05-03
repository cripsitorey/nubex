import { Router } from 'express';
import { createVenta, updatePagadoA, getSales } from '../controllers/salesController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';
import { upload, processMedia } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Vendedores y Admins pueden crear ventas
router.use(verifyToken, verifyRole(['ADMIN', 'VENDEDOR']));

router.post('/', upload.single('comprobante'), processMedia, createVenta);
router.get('/', verifyRole(['ADMIN', 'VENDEDOR']), getSales);
router.patch('/:id/pagadoA', updatePagadoA);

export default router;
