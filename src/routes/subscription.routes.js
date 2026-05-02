import { Router } from 'express';
import { deliverSubscription } from '../controllers/subscriptionController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken, verifyRole(['ADMIN', 'VENDEDOR']));
router.post('/deliver', deliverSubscription);

export default router;
