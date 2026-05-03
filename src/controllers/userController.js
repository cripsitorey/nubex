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

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, role, password, conSuscripcion } = req.body;

    const updateData = { nombre, telefono, email, role };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.$transaction(async (prismaClient) => {
      const user = await prismaClient.user.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      // Manejar la suscripción si es cliente
      if (role === 'CLIENTE') {
        const suscripcionExistente = await prismaClient.suscripcion.findUnique({
          where: { clienteId: parseInt(id) }
        });

        if (conSuscripcion && !suscripcionExistente) {
          await prismaClient.suscripcion.create({
            data: { clienteId: parseInt(id), activa: true }
          });
        } else if (!conSuscripcion && suscripcionExistente) {
          await prismaClient.suscripcion.delete({
            where: { clienteId: parseInt(id) }
          });
        }
      }

      return user;
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cédula, teléfono o email ya registrados por otro usuario' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Intentar borrar (si tiene ventas asociadas, Prisma lanzará error de foreign key P2003)
    await prisma.$transaction(async (prismaClient) => {
      // Borrar dependencias seguras primero
      await prismaClient.logroFidelidad.deleteMany({ where: { clienteId: parseInt(id) } });
      await prismaClient.suscripcion.deleteMany({ where: { clienteId: parseInt(id) } });
      await prismaClient.inventarioVendedor.deleteMany({ where: { vendedorId: parseInt(id) } });
      
      await prismaClient.user.delete({
        where: { id: parseInt(id) }
      });
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'No se puede eliminar el usuario porque tiene ventas o registros históricos asociados. Intenta cambiar sus datos o rol.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    next(error);
  }
};
