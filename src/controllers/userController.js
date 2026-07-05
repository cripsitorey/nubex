import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';

const userSelect = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  cedula: true,
  role: true,
  activo: true,
  createdAt: true,
};

export const list = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const where = { activo: true };
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
        { cedula: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { nombre: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ data: users, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        suscripcion: {
          include: {
            entregas: { orderBy: { fechaEntrega: 'desc' }, take: 5 },
            vapesPermitidos: { include: { modelo: { include: { variantes: { where: { activo: true } } } } } },
            solicitudes: {
              where: { estado: 'PENDIENTE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { variante: { include: { modelo: true } } },
            },
          },
        },
        logros: { where: { reclamado: false } },
        ventasComoCliente: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { variante: { include: { modelo: true } } },
        },
        comisionDefault: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { nombre, email, telefono, cedula, password, role } = req.body;
    if (!nombre || !password) {
      return res.status(400).json({ error: 'nombre y password son requeridos' });
    }
    // Un vendedor solo puede registrar clientes, nunca otros vendedores/admins.
    const roleFinal = req.user.role === 'ADMIN' ? (role || 'CLIENTE') : 'CLIENTE';
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nombre, email, telefono, cedula, password: hashed, role: roleFinal },
      select: userSelect,
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email, teléfono o cédula ya registrados' });
    }
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }
    const { nombre, email, telefono, cedula, password } = req.body;
    const data = {};
    if (nombre) data.nombre = nombre;
    if (email) data.email = email;
    if (telefono) data.telefono = telefono;
    if (cedula) data.cedula = cedula;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    res.json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email, teléfono o cédula ya registrados' });
    }
    next(err);
  }
};

export const deactivate = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { activo: false },
    });
    res.json({ message: 'Usuario desactivado' });
  } catch (err) {
    next(err);
  }
};

// Buscador de clientes para POS
const clienteSelect = { id: true, nombre: true, telefono: true, cedula: true };

export const searchClientes = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      // Sin búsqueda: sugerir los últimos clientes con una venta, y
      // completar con los últimos registrados si hacen falta.
      const ventasRecientes = await prisma.venta.findMany({
        where: { clienteId: { not: null } },
        distinct: ['clienteId'],
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { cliente: { select: clienteSelect } },
      });
      const recientesPorVenta = ventasRecientes.map((v) => v.cliente).filter(Boolean);
      const idsVistos = recientesPorVenta.map((c) => c.id);

      const faltantes = 8 - recientesPorVenta.length;
      const recientesPorRegistro = faltantes > 0
        ? await prisma.user.findMany({
            where: { role: 'CLIENTE', activo: true, id: { notIn: idsVistos } },
            orderBy: { createdAt: 'desc' },
            take: faltantes,
            select: clienteSelect,
          })
        : [];

      return res.json([...recientesPorVenta, ...recientesPorRegistro]);
    }

    const clientes = await prisma.user.findMany({
      where: {
        role: 'CLIENTE',
        activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { telefono: { contains: q } },
          { cedula: { contains: q } },
        ],
      },
      select: clienteSelect,
      take: 10,
    });
    res.json(clientes);
  } catch (err) {
    next(err);
  }
};
