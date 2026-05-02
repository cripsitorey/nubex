import { prisma } from '../prisma.js';

export const assignVapesToVendedor = async (req, res, next) => {
  try {
    const { vendedorId, vapeId, cantidad } = req.body;

    if (!vendedorId || !vapeId || !cantidad || cantidad <= 0) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    const assignment = await prisma.$transaction(async (prismaClient) => {
      // Verificar stock global
      const vape = await prismaClient.vape.findUnique({ where: { id: parseInt(vapeId) } });
      
      if (!vape) {
        throw new Error('Vape no encontrado');
      }

      if (vape.stockGlobal < cantidad) {
        throw new Error('Stock global insuficiente');
      }

      // Restar stock global
      await prismaClient.vape.update({
        where: { id: parseInt(vapeId) },
        data: { stockGlobal: vape.stockGlobal - parseInt(cantidad) }
      });

      // Sumar al inventario del vendedor (crear si no existe)
      const inventario = await prismaClient.inventarioVendedor.upsert({
        where: {
          vendedorId_vapeId: {
            vendedorId: parseInt(vendedorId),
            vapeId: parseInt(vapeId)
          }
        },
        update: {
          cantidad: { increment: parseInt(cantidad) }
        },
        create: {
          vendedorId: parseInt(vendedorId),
          vapeId: parseInt(vapeId),
          cantidad: parseInt(cantidad)
        }
      });

      return inventario;
    });

    res.status(200).json({ message: 'Vapes asignados exitosamente', assignment });
  } catch (error) {
    if (error.message === 'Vape no encontrado' || error.message === 'Stock global insuficiente') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};
