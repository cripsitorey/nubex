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
        throw new Error('Stock insuficiente en tu inventario');
      }

      // Obtener snapshot del vape (costo actual)
      const vape = await prismaClient.vape.findUnique({
        where: { id: parseInt(vapeId) }
      });

      // Cálculo del monto dinámico
      const totalVenta = parseFloat(precioVenta) * parseInt(cantidad);
      let montoParaAdmin = 0;
      let montoParaVendedor = 0;

      if (reparto && reparto.tipo === 'FIJO') {
        montoParaAdmin = parseFloat(reparto.valorAdmin);
        montoParaVendedor = totalVenta - montoParaAdmin;
      } else if (reparto && reparto.tipo === 'PORCENTAJE') {
        montoParaAdmin = totalVenta * (parseFloat(reparto.valorAdmin) / 100);
        montoParaVendedor = totalVenta - montoParaAdmin;
      } else {
        // Fallback: Admin recupera su costo y Vendedor se lleva la ganancia restante
        montoParaAdmin = vape.costo * parseInt(cantidad);
        montoParaVendedor = totalVenta - montoParaAdmin;
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
    if (error.message === 'Stock insuficiente en tu inventario') {
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

    res.json(venta);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    next(error);
  }
};
