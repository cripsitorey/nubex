import { Router } from 'express';
import { createUserByAdmin, getUsers } from '../controllers/userController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas protegidas por token y rol ADMIN
router.use(verifyToken, verifyRole(['ADMIN']));

router.post('/', createUserByAdmin);
router.get('/', getUsers);

export default router;
