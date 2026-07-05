import { Router } from 'express';
import { listModelos, listPublicos, getModelo, createModelo, updateModelo, addVariante, updateVariante, adjustStock } from '../controllers/vapeController.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';
import { upload, processImage } from '../middlewares/upload.js';

const router = Router();

router.get('/publico', listPublicos);
router.get('/', requireAuth, listModelos);
router.get('/:id', requireAuth, getModelo);
router.post('/', requireAdmin, upload.single('imagen'), processImage, createModelo);
router.patch('/:id', requireAdmin, upload.single('imagen'), processImage, updateModelo);

router.post('/:id/variantes', requireAdmin, upload.single('imagen'), processImage, addVariante);
router.patch('/:id/variantes/:varianteId', requireAdmin, upload.single('imagen'), processImage, updateVariante);
router.patch('/:id/variantes/:varianteId/stock', requireAdmin, adjustStock);

export default router;
