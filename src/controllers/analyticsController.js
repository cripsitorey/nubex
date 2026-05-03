import { prisma } from '../prisma.js';

export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Ventas agrupadas por mes (últimos 12 meses)
    const ventas = await prisma.venta.findMany({
      select: {
        precioVenta: true,
        costoAdquisicion: true,
        cantidad: true,
        montoParaAdmin: true,
        montoParaVendedor: true,
        createdAt: true,
      },
    });

    // Agrupar ventas por mes
    const ventasPorMes = {};
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    ventas.forEach(v => {
      const d = new Date(v.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!ventasPorMes[key]) {
        ventasPorMes[key] = { name: meses[d.getMonth()], ingresos: 0, costo: 0 };
      }
      ventasPorMes[key].ingresos += v.precioVenta * v.cantidad;
      ventasPorMes[key].costo += v.costoAdquisicion * v.cantidad;
    });
    const dataRevenue = Object.values(ventasPorMes);

    // 2. Distribución de suscripciones por plan
    const suscripciones = await prisma.suscripcion.findMany({
      where: { activa: true },
      include: { plan: { select: { nombre: true } } },
    });

    const planCounts = {};
    let casualCount = 0;
    suscripciones.forEach(s => {
      const planName = s.plan?.nombre || 'Sin Plan';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    // Contar clientes casuales (sin suscripción activa)
    const totalClientes = await prisma.user.count({ where: { role: 'CLIENTE' } });
    casualCount = totalClientes - suscripciones.length;
    if (casualCount > 0) planCounts['Casual'] = casualCount;

    const dataPlans = Object.entries(planCounts).map(([name, value]) => ({ name, value }));

    // 3. Stock por producto
    const vapes = await prisma.vape.findMany({
      select: { nombre: true, stockGlobal: true, createdAt: true },
    });
    const dataStock = vapes.map(v => ({
      name: v.nombre,
      stock: v.stockGlobal,
    }));

    // 4. KPI Totals
    const totalVentas = ventas.length;
    const ingresosTotales = ventas.reduce((sum, v) => sum + (v.precioVenta * v.cantidad), 0);
    const utilidadTotal = ventas.reduce((sum, v) => sum + ((v.precioVenta - v.costoAdquisicion) * v.cantidad), 0);

    res.json({
      dataRevenue,
      dataPlans,
      dataStock,
      kpis: {
        totalVentas,
        ingresosTotales,
        utilidadTotal,
        totalClientes,
        totalSuscriptores: suscripciones.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
