import { Router } from 'express';
import { getVapes, getVapeById, createVape, updateVape, deleteVape } from '../controllers/vapeController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';
import { upload, processMedia } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Rutas públicas o solo verificadas por token (depende de tu lógica, asumo que cualquiera logueado puede ver)
router.get('/', getVapes);
router.get('/:id', getVapeById);

// Rutas protegidas para ADMIN
router.use(verifyToken, verifyRole(['ADMIN']));
router.post('/', upload.array('media', 10), processMedia, createVape);
router.put('/:id', upload.array('media', 10), processMedia, updateVape);
router.delete('/:id', deleteVape);

export default router;
