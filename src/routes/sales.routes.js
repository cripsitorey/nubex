import { Router } from 'express';
import { createVenta, getVentas, updateVenta } from '../controllers/salesController.js';
import { requireAdmin, requireVendedor } from '../middlewares/auth.js';
import { upload, processImage } from '../middlewares/upload.js';

const router = Router();

router.get('/', requireVendedor, getVentas);
router.post('/', requireVendedor, upload.single('comprobante'), processImage, createVenta);
router.patch('/:id', requireAdmin, updateVenta);

export default router;
