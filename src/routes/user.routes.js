import { Router } from 'express';
import { createUserByAdmin, getUsers, updateUser, deleteUser } from '../controllers/userController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

// GET /users -> ADMIN y VENDEDOR pueden listar usuarios
router.get('/', verifyRole(['ADMIN', 'VENDEDOR']), getUsers);

// POST, PUT, DELETE -> Solo ADMIN
router.post('/', verifyRole(['ADMIN']), createUserByAdmin);
router.put('/:id', verifyRole(['ADMIN']), updateUser);
router.delete('/:id', verifyRole(['ADMIN']), deleteUser);

export default router;
