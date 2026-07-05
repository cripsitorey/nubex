import { prisma } from '../prisma.js';

export const getInventario = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'VENDEDOR') {
      where.vendedorId = req.user.id;
    } else if (req.query.vendedorId) {
      where.vendedorId = parseInt(req.query.vendedorId);
    }

    const inventario = await prisma.inventarioVendedor.findMany({
      where,
      include: {
        variante: { include: { modelo: true } },
        vendedor: { select: { id: true, nombre: true } },
      },
      orderBy: [{ vendedor: { nombre: 'asc' } }, { variante: { sabor: 'asc' } }],
    });
    res.json(inventario);
  } catch (err) {
    next(err);
  }
};

// Admin asigna stock de bodega central al inventario de un vendedor
export const asignar = async (req, res, next) => {
  try {
    const { vendedorId, varianteId, cantidad } = req.body;
    if (!vendedorId || !varianteId || !cantidad) {
      return res.status(400).json({ error: 'vendedorId, varianteId y cantidad son requeridos' });
    }
    const cantidadInt = parseInt(cantidad);
    if (cantidadInt <= 0) return res.status(400).json({ error: 'Cantidad inválida' });

    const result = await prisma.$transaction(async (tx) => {
      const variante = await tx.vapeVariante.findUnique({ where: { id: parseInt(varianteId) } });
      if (!variante) throw new Error('Variante no encontrada');
      if (variante.stock < cantidadInt) throw new Error('Stock insuficiente en bodega');

      await tx.vapeVariante.update({
        where: { id: parseInt(varianteId) },
        data: { stock: variante.stock - cantidadInt },
      });

      const inv = await tx.inventarioVendedor.upsert({
        where: { vendedorId_varianteId: { vendedorId: parseInt(vendedorId), varianteId: parseInt(varianteId) } },
        update: { cantidad: { increment: cantidadInt } },
        create: { vendedorId: parseInt(vendedorId), varianteId: parseInt(varianteId), cantidad: cantidadInt },
        include: { variante: { include: { modelo: true } }, vendedor: { select: { id: true, nombre: true } } },
      });
      return inv;
    });

    res.json(result);
  } catch (err) {
    if (err.message === 'Stock insuficiente en bodega' || err.message === 'Variante no encontrada') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// Devolver stock del vendedor a bodega
export const devolver = async (req, res, next) => {
  try {
    const { vendedorId, varianteId, cantidad } = req.body;
    const cantidadInt = parseInt(cantidad);

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventarioVendedor.findUnique({
        where: { vendedorId_varianteId: { vendedorId: parseInt(vendedorId), varianteId: parseInt(varianteId) } },
      });
      if (!inv || inv.cantidad < cantidadInt) throw new Error('Stock insuficiente en inventario del vendedor');

      await tx.inventarioVendedor.update({
        where: { vendedorId_varianteId: { vendedorId: parseInt(vendedorId), varianteId: parseInt(varianteId) } },
        data: { cantidad: { decrement: cantidadInt } },
      });
      await tx.vapeVariante.update({
        where: { id: parseInt(varianteId) },
        data: { stock: { increment: cantidadInt } },
      });
      return { message: 'Stock devuelto a bodega' };
    });

    res.json(result);
  } catch (err) {
    if (err.message === 'Stock insuficiente en inventario del vendedor') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const setComisionVendedor = async (req, res, next) => {
  try {
    const { vendedorId, tipo, valor } = req.body;
    const comision = await prisma.comisionVendedor.upsert({
      where: { vendedorId: parseInt(vendedorId) },
      update: { tipo, valor: parseFloat(valor) },
      create: { vendedorId: parseInt(vendedorId), tipo, valor: parseFloat(valor) },
    });
    res.json(comision);
  } catch (err) {
    next(err);
  }
};
