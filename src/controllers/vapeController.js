import { prisma } from '../prisma.js';

// Obtener todos los vapes
export const getVapes = async (req, res, next) => {
  try {
    const vapes = await prisma.vape.findMany();
    res.json(vapes);
  } catch (error) {
    next(error);
  }
};

// Obtener un vape por ID
export const getVapeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vape = await prisma.vape.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!vape) {
      return res.status(404).json({ error: 'Vape no encontrado' });
    }
    res.json(vape);
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo vape
export const createVape = async (req, res, next) => {
  try {
    const { nombre, descripcion, costo, precio, stockGlobal } = req.body;
    let imagenUrl = null;

    if (req.file) {
      // req.file ya fue procesado por processImage en uploadMiddleware
      imagenUrl = `/uploads/${req.file.filename}`;
    }

    const newVape = await prisma.vape.create({
      data: {
        nombre,
        descripcion,
        costo: parseFloat(costo),
        precio: parseFloat(precio),
        stockGlobal: stockGlobal ? parseInt(stockGlobal) : 0,
        imagenUrl
      }
    });

    res.status(201).json(newVape);
  } catch (error) {
    next(error);
  }
};

// Actualizar un vape
export const updateVape = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, costo, precio, stockGlobal } = req.body;
    
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (costo !== undefined) updateData.costo = parseFloat(costo);
    if (precio !== undefined) updateData.precio = parseFloat(precio);
    if (stockGlobal !== undefined) updateData.stockGlobal = parseInt(stockGlobal);

    if (req.file) {
      updateData.imagenUrl = `/uploads/${req.file.filename}`;
    }

    const updatedVape = await prisma.vape.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(updatedVape);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vape no encontrado' });
    }
    next(error);
  }
};

// Eliminar un vape
export const deleteVape = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.vape.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vape no encontrado' });
    }
    next(error);
  }
};
