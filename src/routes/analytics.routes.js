import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Solo ADMIN puede ver analytics
router.use(verifyToken, verifyRole(['ADMIN']));
router.get('/', getAnalytics);

export default router;
