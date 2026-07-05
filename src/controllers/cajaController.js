import { prisma } from '../prisma.js';

export const getMovimientos = async (req, res, next) => {
  try {
    const { tipo, categoria, desde, hasta, page = 1, limit = 50 } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    const [movimientos, total] = await Promise.all([
      prisma.movimientoCaja.findMany({
        where,
        include: { registradoPor: { select: { id: true, nombre: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.movimientoCaja.count({ where }),
    ]);

    // Totales
    const [totalIngresos, totalEgresos] = await Promise.all([
      prisma.movimientoCaja.aggregate({ where: { ...where, tipo: 'INGRESO' }, _sum: { monto: true } }),
      prisma.movimientoCaja.aggregate({ where: { ...where, tipo: 'EGRESO' }, _sum: { monto: true } }),
    ]);

    res.json({
      data: movimientos,
      total,
      page: Number(page),
      resumen: {
        ingresos: totalIngresos._sum.monto || 0,
        egresos: totalEgresos._sum.monto || 0,
        balance: (totalIngresos._sum.monto || 0) - (totalEgresos._sum.monto || 0),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createMovimiento = async (req, res, next) => {
  try {
    const { tipo, categoria, monto, metodoPago, descripcion, referenciaId, referenciaTipo } = req.body;
    if (!tipo || !categoria || !monto || !descripcion) {
      return res.status(400).json({ error: 'tipo, categoria, monto y descripcion son requeridos' });
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        tipo,
        categoria,
        monto: parseFloat(monto),
        metodoPago: metodoPago || 'EFECTIVO',
        descripcion,
        referenciaId: referenciaId ? parseInt(referenciaId) : null,
        referenciaTipo,
        registradoPorId: req.user.id,
      },
      include: { registradoPor: { select: { id: true, nombre: true } } },
    });
    res.status(201).json(movimiento);
  } catch (err) {
    next(err);
  }
};
