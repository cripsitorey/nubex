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
    const { nombre, descripcion, costo, precio, precioVendedor, puffs, sabor, stockGlobal, mostrarPrecio } = req.body;

    if (!nombre || !costo || !precio || !precioVendedor || !puffs || !sabor) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes: nombre, costo, precio, precioVendedor, puffs, sabor' });
    }

    let imagenUrl = null;
    let media = [];

    // req.files fue procesado por processMedia
    if (req.files && req.files.length > 0) {
      // Usar la primera imagen como imagenUrl (legacy/principal)
      const primeraImagen = req.files.find(f => f.mimetype.startsWith('image/'));
      if (primeraImagen) {
        imagenUrl = `/uploads/${primeraImagen.filename}`;
      } else {
        imagenUrl = `/uploads/${req.files[0].filename}`; // Fallback si es un video principal
      }

      media = req.files.map(f => ({
        url: `/uploads/${f.filename}`,
        type: f.mimetype.startsWith('image/') ? 'image' : 'video',
        mimetype: f.mimetype
      }));
    } else if (req.file) {
      // Por si se envía con upload.single
      imagenUrl = `/uploads/${req.file.filename}`;
      media = [{
        url: imagenUrl,
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
        mimetype: req.file.mimetype
      }];
    }

    const newVape = await prisma.vape.create({
      data: {
        nombre,
        descripcion,
        costo: parseFloat(costo),
        precio: parseFloat(precio),
        precioVendedor: parseFloat(precioVendedor),
        puffs: parseInt(puffs),
        sabor,
        stockGlobal: stockGlobal ? parseInt(stockGlobal) : 0,
        mostrarPrecio: mostrarPrecio !== undefined ? mostrarPrecio === 'true' || mostrarPrecio === true : true,
        imagenUrl,
        media
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
    const { nombre, descripcion, costo, precio, precioVendedor, puffs, sabor, stockGlobal, mostrarPrecio } = req.body;
    
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (costo !== undefined) updateData.costo = parseFloat(costo);
    if (precio !== undefined) updateData.precio = parseFloat(precio);
    if (precioVendedor !== undefined) updateData.precioVendedor = parseFloat(precioVendedor);
    if (puffs !== undefined) updateData.puffs = parseInt(puffs);
    if (sabor !== undefined) updateData.sabor = sabor;
    if (stockGlobal !== undefined) updateData.stockGlobal = parseInt(stockGlobal);
    if (mostrarPrecio !== undefined) updateData.mostrarPrecio = mostrarPrecio === 'true' || mostrarPrecio === true;

    // Si se suben nuevos archivos, reemplazamos el array de media por completo
    // En una implementación más avanzada se podrían añadir o borrar individualmente
    if (req.files && req.files.length > 0) {
      const primeraImagen = req.files.find(f => f.mimetype.startsWith('image/'));
      if (primeraImagen) {
        updateData.imagenUrl = `/uploads/${primeraImagen.filename}`;
      } else {
        updateData.imagenUrl = `/uploads/${req.files[0].filename}`;
      }

      updateData.media = req.files.map(f => ({
        url: `/uploads/${f.filename}`,
        type: f.mimetype.startsWith('image/') ? 'image' : 'video',
        mimetype: f.mimetype
      }));
    } else if (req.file) {
      updateData.imagenUrl = `/uploads/${req.file.filename}`;
      updateData.media = [{
        url: updateData.imagenUrl,
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
        mimetype: req.file.mimetype
      }];
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
