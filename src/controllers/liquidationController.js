import { prisma } from '../prisma.js';

export const previewLiquidacion = async (req, res, next) => {
  try {
    const { vendedorId } = req.params;

    const ventas = await prisma.venta.findMany({
      where: {
        vendedorId: parseInt(vendedorId),
        estado: 'PENDIENTE_LIQUIDACION'
      },
      include: {
        vape: true
      }
    });

    if (ventas.length === 0) {
      return res.status(200).json({
        message: 'No hay ventas pendientes de liquidación',
        balanceAdmin: 0,
        balanceVendedor: 0,
        balanceNeto: 0,
        ventas: []
      });
    }

    let balanceAdmin = 0;
    let balanceVendedor = 0;
    let netoVendedorDebeAAdmin = 0;

    ventas.forEach(venta => {
      // Costo que le corresponde al admin
      const gananciaAdmin = venta.montoParaAdmin;
      // Ganancia que le corresponde al vendedor
      const gananciaVendedor = venta.montoParaVendedor;

      if (venta.pagadoA === 'VENDEDOR') {
        // El vendedor tiene todo el dinero de la venta.
        // Debe entregarle al admin su parte.
        netoVendedorDebeAAdmin += gananciaAdmin;
        balanceAdmin += gananciaAdmin;
        balanceVendedor += gananciaVendedor; // El vendedor ya lo tiene, este es su balance a favor
      } else if (venta.pagadoA === 'ADMIN') {
        // El admin tiene todo el dinero de la venta.
        // El admin le debe al vendedor su parte de la ganancia.
        netoVendedorDebeAAdmin -= gananciaVendedor;
        balanceAdmin += gananciaAdmin; // El admin ya lo tiene
        balanceVendedor += gananciaVendedor;
      }
    });

    res.status(200).json({
      vendedorId: parseInt(vendedorId),
      totalVentas: ventas.length,
      balanceAdmin, // Lo que el admin ganó en total en este lote
      balanceVendedor, // Lo que el vendedor ganó en total en este lote
      netoVendedorDebeAAdmin, // Si es positivo, el Vendedor paga al Admin. Si es negativo, el Admin le paga al Vendedor (absoluto)
      ventas
    });
  } catch (error) {
    next(error);
  }
};

export const executeLiquidacion = async (req, res, next) => {
  try {
    const { vendedorId } = req.body;

    if (!vendedorId) {
      return res.status(400).json({ error: 'Falta vendedorId' });
    }

    // Usar una transacción para evitar inconsistencias
    const liquidacion = await prisma.$transaction(async (prismaClient) => {
      const ventas = await prismaClient.venta.findMany({
        where: {
          vendedorId: parseInt(vendedorId),
          estado: 'PENDIENTE_LIQUIDACION'
        }
      });

      if (ventas.length === 0) {
        throw new Error('No hay ventas pendientes');
      }

      let netoVendedorDebeAAdmin = 0;

      ventas.forEach(venta => {
        const gananciaAdmin = venta.montoParaAdmin;
        const gananciaVendedor = venta.montoParaVendedor;

        if (venta.pagadoA === 'VENDEDOR') {
          netoVendedorDebeAAdmin += gananciaAdmin;
        } else if (venta.pagadoA === 'ADMIN') {
          netoVendedorDebeAAdmin -= gananciaVendedor;
        }
      });

      // Crear la Liquidacion
      const nuevaLiquidacion = await prismaClient.liquidacion.create({
        data: {
          vendedorId: parseInt(vendedorId),
          montoTotal: netoVendedorDebeAAdmin,
          cerrada: true // La creamos directamente como cerrada en este caso simple
        }
      });

      // Actualizar ventas a LIQUIDADA y enlazar con la Liquidacion
      await prismaClient.venta.updateMany({
        where: {
          id: { in: ventas.map(v => v.id) }
        },
        data: {
          estado: 'LIQUIDADA',
          liquidacionId: nuevaLiquidacion.id
        }
      });

      return nuevaLiquidacion;
    });

    res.status(201).json({
      message: 'Liquidación ejecutada exitosamente',
      liquidacion
    });
  } catch (error) {
    if (error.message === 'No hay ventas pendientes') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};
