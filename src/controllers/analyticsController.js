import { prisma } from '../prisma.js';

export const getDashboard = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const rangoFecha = {};
    if (desde) rangoFecha.gte = new Date(desde);
    if (hasta) rangoFecha.lte = new Date(hasta);
    const filtroFecha = Object.keys(rangoFecha).length ? { createdAt: rangoFecha } : {};

    const [
      totalVentas,
      ingresoAdmin,
      ingresoVendedores,
      ventasPorEstado,
      topVariantes,
      topVendedores,
      totalClientes,
      suscripcionesActivas,
      balanceCaja,
    ] = await Promise.all([
      prisma.venta.count({ where: filtroFecha }),
      prisma.venta.aggregate({ where: filtroFecha, _sum: { montoParaAdmin: true } }),
      prisma.venta.aggregate({ where: filtroFecha, _sum: { montoParaVendedor: true } }),
      prisma.venta.groupBy({ by: ['estado'], where: filtroFecha, _count: true }),
      prisma.venta.groupBy({
        by: ['varianteId'],
        where: filtroFecha,
        _sum: { cantidad: true },
        orderBy: { _sum: { cantidad: 'desc' } },
        take: 5,
      }),
      prisma.venta.groupBy({
        by: ['vendedorId'],
        where: filtroFecha,
        _sum: { montoParaVendedor: true },
        _count: true,
        orderBy: { _sum: { montoParaVendedor: 'desc' } },
        take: 5,
      }),
      prisma.user.count({ where: { role: 'CLIENTE', activo: true } }),
      prisma.suscripcion.count({ where: { activa: true } }),
      prisma.movimientoCaja.groupBy({
        by: ['tipo'],
        where: filtroFecha,
        _sum: { monto: true },
      }),
    ]);

    // Enriquecer top variantes con nombre
    const varianteIds = topVariantes.map((v) => v.varianteId);
    const variantes = await prisma.vapeVariante.findMany({
      where: { id: { in: varianteIds } },
      include: { modelo: { select: { nombre: true, marca: true } } },
    });
    const variantesMap = Object.fromEntries(variantes.map((v) => [v.id, v]));

    // Enriquecer top vendedores con nombre
    const vendedorIds = topVendedores.map((v) => v.vendedorId);
    const vendedores = await prisma.user.findMany({
      where: { id: { in: vendedorIds } },
      select: { id: true, nombre: true },
    });
    const vendedoresMap = Object.fromEntries(vendedores.map((v) => [v.id, v]));

    const ingresoCaja = balanceCaja.find((b) => b.tipo === 'INGRESO')?._sum?.monto || 0;
    const egresoCaja = balanceCaja.find((b) => b.tipo === 'EGRESO')?._sum?.monto || 0;

    res.json({
      ventas: {
        total: totalVentas,
        ingresoAdmin: ingresoAdmin._sum.montoParaAdmin || 0,
        ingresoVendedores: ingresoVendedores._sum.montoParaVendedor || 0,
        porEstado: ventasPorEstado,
      },
      topVariantes: topVariantes.map((v) => ({
        variante: variantesMap[v.varianteId],
        cantidadVendida: v._sum.cantidad,
      })),
      topVendedores: topVendedores.map((v) => ({
        vendedor: vendedoresMap[v.vendedorId],
        totalGanado: v._sum.montoParaVendedor,
        totalVentas: v._count,
      })),
      clientes: { total: totalClientes, conSuscripcion: suscripcionesActivas },
      caja: { ingresos: ingresoCaja, egresos: egresoCaja, balance: ingresoCaja - egresoCaja },
    });
  } catch (err) {
    next(err);
  }
};

export const getVentasPorPeriodo = async (req, res, next) => {
  try {
    const { desde, hasta, agrupacion = 'dia' } = req.query;
    const ventas = await prisma.venta.findMany({
      where: {
        createdAt: {
          gte: desde ? new Date(desde) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lte: hasta ? new Date(hasta) : new Date(),
        },
      },
      select: { createdAt: true, montoParaAdmin: true, montoParaVendedor: true, cantidad: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por día
    const grouped = {};
    for (const v of ventas) {
      const key = v.createdAt.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = { fecha: key, ventas: 0, ingresoAdmin: 0, ingresoVendedores: 0 };
      grouped[key].ventas += v.cantidad;
      grouped[key].ingresoAdmin += v.montoParaAdmin;
      grouped[key].ingresoVendedores += v.montoParaVendedor;
    }

    res.json(Object.values(grouped));
  } catch (err) {
    next(err);
  }
};
