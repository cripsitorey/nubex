import { Router } from 'express';
import {
  getPlanes, createPlan, updatePlan,
  getSuscripciones, suscribir, cancelarSuscripcion,
  registrarEntrega, getEntregas,
  solicitarEntrega, getSolicitudesPendientes, rechazarSolicitud,
} from '../controllers/subscriptionController.js';
import { requireAdmin, requireAuth, requireVendedor } from '../middlewares/auth.js';

const router = Router();

// Planes
router.get('/planes', requireAuth, getPlanes);
router.post('/planes', requireAdmin, createPlan);
router.patch('/planes/:id', requireAdmin, updatePlan);

// Suscripciones
router.get('/', requireAuth, getSuscripciones);
router.post('/', requireAdmin, suscribir);
router.patch('/:id/cancelar', requireAdmin, cancelarSuscripcion);

// Solicitudes de entrega (el cliente pide, admin/vendedor la resuelve)
router.get('/solicitudes', requireVendedor, getSolicitudesPendientes);
router.post('/:id/solicitudes', requireAuth, solicitarEntrega);
router.patch('/solicitudes/:id/rechazar', requireVendedor, rechazarSolicitud);

// Entregas
router.get('/:id/entregas', requireAuth, getEntregas);
router.post('/:id/entregas', requireVendedor, registrarEntrega);

export default router;
