import { Router } from 'express';
import { createUserByAdmin, getUsers, updateUser, deleteUser } from '../controllers/userController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas protegidas por token y rol ADMIN
router.use(verifyToken, verifyRole(['ADMIN']));

router.post('/', createUserByAdmin);
router.get('/', getUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
