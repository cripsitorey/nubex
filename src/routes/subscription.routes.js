import { Router } from 'express';
import { deliverSubscription, getPlans, createPlan, updatePlan, deletePlan } from '../controllers/subscriptionController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas (para ver los planes)
router.get('/plans', getPlans);

// Rutas protegidas para ADMIN (CRUD de planes)
router.post('/plans', verifyToken, verifyRole(['ADMIN']), createPlan);
router.put('/plans/:id', verifyToken, verifyRole(['ADMIN']), updatePlan);
router.delete('/plans/:id', verifyToken, verifyRole(['ADMIN']), deletePlan);

// Entregas de suscripción
router.use(verifyToken, verifyRole(['ADMIN', 'VENDEDOR']));
router.post('/deliver', deliverSubscription);

export default router;
