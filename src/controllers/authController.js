import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Credenciales requeridas' });
    }

    const user = await prisma.user.findFirst({
      where: {
        activo: true,
        OR: [
          { email: identifier },
          { telefono: identifier },
          { cedula: identifier },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    res.json({ token: signToken(user), user: { id: user.id, nombre: user.nombre, role: user.role } });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        cedula: true,
        role: true,
        activo: true,
        createdAt: true,
        suscripcion: { select: { id: true, activa: true, planId: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};
