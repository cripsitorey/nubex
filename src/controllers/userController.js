import { prisma } from '../prisma.js';
import bcrypt from 'bcrypt';

// Solo accesible por ADMIN para crear vendedores y clientes con suscripción
export const createUserByAdmin = async (req, res, next) => {
  try {
    const { nombre, password, cedula, telefono, email, role, conSuscripcion } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (prismaClient) => {
      const user = await prismaClient.user.create({
        data: {
          nombre,
          password: hashedPassword,
          cedula,
          telefono,
          email,
          role // ADMIN puede especificar VENDEDOR, CLIENTE o ADMIN
        }
      });

      if (role === 'CLIENTE' && conSuscripcion) {
        await prismaClient.suscripcion.create({
          data: {
            clienteId: user.id,
            activa: true
          }
        });
      }

      return user;
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

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        cedula: true,
        telefono: true,
        role: true,
        createdAt: true,
        suscripcion: true
      }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};
