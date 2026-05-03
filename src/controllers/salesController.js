import { prisma } from '../prisma.js';

export const createVenta = async (req, res, next) => {
  try {
    const vendedorId = req.user.id; 
    
    // El payload debe traer el objeto "reparto" para saber la partición de la ganancia
    const { clienteId, vapeId, cantidad, precioVenta, pagadoA, reparto } = req.body;
    
    if (!vapeId || !cantidad || !precioVenta) {
      return res.status(400).json({ error: 'Parámetros obligatorios faltantes' });
    }

    let comprobanteUrl = null;
    if (req.file) {
      comprobanteUrl = `/uploads/${req.file.filename}`;
    }

    const venta = await prisma.$transaction(async (prismaClient) => {
      // Obtener snapshot del vape (costo actual)
      const vape = await prismaClient.vape.findUnique({
        where: { id: parseInt(vapeId) }
      });

      if (!vape) {
        throw new Error('Vape no encontrado');
      }

      if (req.user.role === 'ADMIN') {
        if (vape.stockGlobal < parseInt(cantidad)) {
          throw new Error('Stock insuficiente en la bodega central');
        }
        // Restar stock global
        await prismaClient.vape.update({
          where: { id: parseInt(vapeId) },
          data: { stockGlobal: vape.stockGlobal - parseInt(cantidad) }
        });
      } else {
        // Verificar si el vendedor tiene stock
        const inventario = await prismaClient.inventarioVendedor.findUnique({
          where: {
            vendedorId_vapeId: {
              vendedorId: parseInt(vendedorId),
              vapeId: parseInt(vapeId)
            }
          }
        });

        if (!inventario || inventario.cantidad < parseInt(cantidad)) {
          throw new Error('Stock insuficiente en tu inventario asignado');
        }

        // Restar stock del inventario del vendedor
        await prismaClient.inventarioVendedor.update({
          where: {
            vendedorId_vapeId: {
              vendedorId: parseInt(vendedorId),
              vapeId: parseInt(vapeId)
            }
          },
          data: {
            cantidad: inventario.cantidad - parseInt(cantidad)
          }
        });
      }

      // Cálculo del monto dinámico
      const totalVenta = parseFloat(precioVenta) * parseInt(cantidad);
      let montoParaAdmin = 0;
      let montoParaVendedor = 0;

      if (req.user.role === 'ADMIN') {
        // Admin vende directamente: recibe todo el dinero
        montoParaAdmin = totalVenta;
        montoParaVendedor = 0;
      } else if (reparto && reparto.tipo === 'FIJO') {
        montoParaAdmin = parseFloat(reparto.valorAdmin);
        montoParaVendedor = totalVenta - montoParaAdmin;
      } else if (reparto && reparto.tipo === 'PORCENTAJE') {
        montoParaAdmin = totalVenta * (parseFloat(reparto.valorAdmin) / 100);
        montoParaVendedor = totalVenta - montoParaAdmin;
      } else {
        // Fallback: Admin recibe el precioVendedor por cada unidad
        montoParaAdmin = vape.precioVendedor * parseInt(cantidad);
        montoParaVendedor = totalVenta - montoParaAdmin;
      }

      // Registrar la venta
      const nuevaVenta = await prismaClient.venta.create({
        data: {
          vendedorId: parseInt(vendedorId),
          clienteId: clienteId ? parseInt(clienteId) : null,
          vapeId: parseInt(vapeId),
          cantidad: parseInt(cantidad),
          costoAdquisicion: vape.costo,
          precioVenta: parseFloat(precioVenta),
          montoParaAdmin,
          montoParaVendedor,
          pagadoA: pagadoA === 'ADMIN' ? 'ADMIN' : 'VENDEDOR',
          comprobanteUrl,
          estado: 'PENDIENTE_LIQUIDACION'
        }
      });

      let alertaFidelidad = null;
      if (clienteId) {
        const clienteActualizado = await prismaClient.user.update({
          where: { id: parseInt(clienteId) },
          data: { totalVapesComprados: { increment: parseInt(cantidad) } }
        });

        if (clienteActualizado.totalVapesComprados >= 6) {
          await prismaClient.user.update({
            where: { id: parseInt(clienteId) },
            data: { totalVapesComprados: clienteActualizado.totalVapesComprados - 6 }
          });

          await prismaClient.logroFidelidad.create({
            data: {
              clienteId: parseInt(clienteId),
              nombre: 'Vape Gratis',
              descripcion: 'Alcanzó 6 compras. Tiene derecho a 1 vape gratis en su próxima visita.'
            }
          });

          alertaFidelidad = "¡Felicidades! El cliente ha acumulado 6 compras. Su próximo vape es GRATIS.";
        }
      }

      return { nuevaVenta, alertaFidelidad };
    });

    res.status(201).json(venta);
  } catch (error) {
    if (error.message === 'Stock insuficiente en tu inventario asignado' || error.message === 'Stock insuficiente en la bodega central') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

export const updatePagadoA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pagadoA } = req.body;

    if (pagadoA !== 'ADMIN' && pagadoA !== 'VENDEDOR') {
      return res.status(400).json({ error: 'pagadoA debe ser ADMIN o VENDEDOR' });
    }

    const venta = await prisma.venta.update({
      where: { id: parseInt(id) },
      data: { pagadoA }
    });

    res.json({ message: 'Receptor de pago actualizado', venta });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    next(error);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const role = req.user.role;
    let ventas = [];

    if (role === 'ADMIN') {
      ventas = await prisma.venta.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          vendedor: { select: { id: true, nombre: true } },
          cliente: { select: { id: true, nombre: true } },
          vape: { select: { id: true, nombre: true } }
        }
      });
    } else if (role === 'VENDEDOR') {
      ventas = await prisma.venta.findMany({
        where: { vendedorId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nombre: true } },
          vape: { select: { id: true, nombre: true } }
        }
      });
    } else {
      return res.status(403).json({ error: 'No tienes permiso para ver ventas' });
    }

    res.json(ventas);
  } catch (error) {
    next(error);
  }
};
