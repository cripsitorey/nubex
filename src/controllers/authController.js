import { prisma } from '../prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req, res, next) => {
  try {
    const { nombre, password, cedula, telefono, email } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        nombre,
        password: hashedPassword,
        cedula,
        telefono,
        email,
        role: 'CLIENTE' // Por defecto se registran como CLIENTE
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cédula, teléfono o email ya registrados' });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // identifier puede ser cedula o telefono
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Por favor provee identificador y contraseña' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { cedula: identifier },
          { telefono: identifier },
          { email: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        suscripcion: true,
        logros: {
          where: { reclamado: false }
        },
        ventasCompradas: {
          include: { vape: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};
