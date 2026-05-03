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

export const getInventory = async (req, res, next) => {
  try {
    const role = req.user.role;
    
    if (role === 'ADMIN') {
      // Para admin: devolver todos los vapes con su stockGlobal y las asignaciones a cada vendedor
      const vapes = await prisma.vape.findMany({
        include: {
          inventarios: {
            include: {
              vendedor: {
                select: { id: true, nombre: true }
              }
            }
          }
        }
      });
      return res.json(vapes);
    } else if (role === 'VENDEDOR') {
      // Para vendedor: devolver solo los inventarios que tiene asignados, incluyendo datos del vape
      const inventarios = await prisma.inventarioVendedor.findMany({
        where: { vendedorId: req.user.id },
        include: {
          vape: true
        }
      });
      return res.json(inventarios);
    } else {
      return res.status(403).json({ error: 'No tienes permiso para ver el inventario' });
    }
  } catch (error) {
    next(error);
  }
};

export const updateAssignedInventory = async (req, res, next) => {
  try {
    const { id } = req.params; // ID del inventarioVendedor
    const { cantidad } = req.body; // Nueva cantidad EXACTA que debe tener el vendedor

    if (cantidad < 0) {
      return res.status(400).json({ error: 'La cantidad no puede ser negativa' });
    }

    const updated = await prisma.$transaction(async (prismaClient) => {
      const inventario = await prismaClient.inventarioVendedor.findUnique({
        where: { id: parseInt(id) },
        include: { vape: true }
      });

      if (!inventario) throw new Error('Asignación de inventario no encontrada');

      const diferencia = parseInt(cantidad) - inventario.cantidad;
      
      // Si la diferencia es positiva, se le están asignando MÁS vapes al vendedor (se sacan de bodega)
      if (diferencia > 0) {
        if (inventario.vape.stockGlobal < diferencia) {
          throw new Error('Stock global insuficiente para cubrir el aumento');
        }
      }

      // Actualizar bodega (stockGlobal)
      await prismaClient.vape.update({
        where: { id: inventario.vapeId },
        data: { stockGlobal: inventario.vape.stockGlobal - diferencia }
      });

      // Actualizar cantidad del vendedor
      const nuevoInventario = await prismaClient.inventarioVendedor.update({
        where: { id: parseInt(id) },
        data: { cantidad: parseInt(cantidad) }
      });

      return nuevoInventario;
    });

    res.json(updated);
  } catch (error) {
    if (error.message === 'Asignación de inventario no encontrada' || error.message === 'Stock global insuficiente para cubrir el aumento') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

export const removeAssignedInventory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const removed = await prisma.$transaction(async (prismaClient) => {
      const inventario = await prismaClient.inventarioVendedor.findUnique({
        where: { id: parseInt(id) }
      });

      if (!inventario) throw new Error('Asignación no encontrada');

      // Devolver los vapes a la bodega central
      await prismaClient.vape.update({
        where: { id: inventario.vapeId },
        data: { stockGlobal: { increment: inventario.cantidad } }
      });

      // Eliminar el registro
      await prismaClient.inventarioVendedor.delete({
        where: { id: parseInt(id) }
      });

      return { success: true };
    });

    res.json(removed);
  } catch (error) {
    if (error.message === 'Asignación no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};
