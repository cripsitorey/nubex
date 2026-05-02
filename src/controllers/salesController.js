import { prisma } from '../prisma.js';

export const createVenta = async (req, res, next) => {
  try {
    // req.user viene del middleware de auth (token)
    const vendedorId = req.user.id; 
    
    // Parámetros de la venta
    const { clienteId, vapeId, cantidad, precioVenta, quienAbsorbeDescuento } = req.body;
    
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

      // Calcular descuentos
      const precioVentaFinal = parseFloat(precioVenta);
      const precioSugerido = vape.precio;
      let descuentoTotal = 0;
      
      // Multiplicamos por cantidad para tener el descuento real si se venden varios a precio reducido
      if (precioVentaFinal < precioSugerido) {
        descuentoTotal = (precioSugerido - precioVentaFinal) * parseInt(cantidad);
      }

      let descuentoAdmin = 0;
      let descuentoVendedor = 0;

      if (descuentoTotal > 0) {
        if (quienAbsorbeDescuento === 'ADMIN') {
          descuentoAdmin = descuentoTotal;
        } else if (quienAbsorbeDescuento === 'VENDEDOR') {
          descuentoVendedor = descuentoTotal;
        } else {
          // Si no se especifica, por defecto lo absorbe el vendedor
          descuentoVendedor = descuentoTotal;
        }
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
          precioVenta: precioVentaFinal,
          descuentoAdmin,
          descuentoVendedor,
          comprobanteUrl,
          estado: 'PENDIENTE_LIQUIDACION'
        }
      });

      return nuevaVenta;
    });

    res.status(201).json(venta);
  } catch (error) {
    if (error.message === 'Stock insuficiente en tu inventario') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};
