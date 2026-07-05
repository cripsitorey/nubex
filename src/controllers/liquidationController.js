import { prisma } from '../prisma.js';

export const getLiquidaciones = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'VENDEDOR') where.vendedorId = req.user.id;
    else if (req.query.vendedorId) where.vendedorId = parseInt(req.query.vendedorId);
    if (req.query.cerrada !== undefined) where.cerrada = req.query.cerrada === 'true';

    const liquidaciones = await prisma.liquidacion.findMany({
      where,
      include: {
        vendedor: { select: { id: true, nombre: true } },
        ventas: {
          include: { variante: { include: { modelo: { select: { nombre: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(liquidaciones);
  } catch (err) {
    next(err);
  }
};

export const createLiquidacion = async (req, res, next) => {
  try {
    const { vendedorId } = req.body;
    if (!vendedorId) return res.status(400).json({ error: 'vendedorId requerido' });

    const result = await prisma.$transaction(async (tx) => {
      const ventasPendientes = await tx.venta.findMany({
        where: { vendedorId: parseInt(vendedorId), estado: 'PENDIENTE_LIQUIDACION', liquidacionId: null },
      });
      if (ventasPendientes.length === 0) throw new Error('No hay ventas pendientes de liquidación');

      const montoTotal = ventasPendientes.reduce((sum, v) => sum + v.montoParaVendedor, 0);

      const liquidacion = await tx.liquidacion.create({
        data: {
          vendedorId: parseInt(vendedorId),
          montoTotal,
          ventas: { connect: ventasPendientes.map((v) => ({ id: v.id })) },
        },
        include: { vendedor: { select: { id: true, nombre: true } }, ventas: true },
      });

      await tx.venta.updateMany({
        where: { id: { in: ventasPendientes.map((v) => v.id) } },
        data: { estado: 'LIQUIDADA', liquidacionId: liquidacion.id },
      });

      return liquidacion;
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.message === 'No hay ventas pendientes de liquidación') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const cerrarLiquidacion = async (req, res, next) => {
  try {
    const liquidacion = await prisma.liquidacion.update({
      where: { id: parseInt(req.params.id) },
      data: { cerrada: true },
    });
    res.json(liquidacion);
  } catch (err) {
    next(err);
  }
};
