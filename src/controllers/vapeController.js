import { prisma } from '../prisma.js';

const modeloInclude = {
  variantes: { where: { activo: true }, orderBy: { sabor: 'asc' } },
};

export const listModelos = async (req, res, next) => {
  try {
    const { soloActivos = 'true', search } = req.query;
    const where = {};
    if (soloActivos === 'true') where.activo = true;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
      ];
    }
    const modelos = await prisma.vapeModelo.findMany({
      where,
      include: modeloInclude,
      orderBy: { nombre: 'asc' },
    });
    res.json(modelos);
  } catch (err) {
    next(err);
  }
};

export const listPublicos = async (req, res, next) => {
  try {
    const modelos = await prisma.vapeModelo.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        marca: true,
        descripcion: true,
        puffs: true,
        precioSugerido: true,
        mostrarPrecio: true,
        imagenUrl: true,
        variantes: {
          where: { activo: true },
          orderBy: { sabor: 'asc' },
          select: { id: true, sabor: true, imagenUrl: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(modelos);
  } catch (err) {
    next(err);
  }
};

export const getModelo = async (req, res, next) => {
  try {
    const modelo = await prisma.vapeModelo.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { variantes: { orderBy: { sabor: 'asc' } } },
    });
    if (!modelo) return res.status(404).json({ error: 'Modelo no encontrado' });
    res.json(modelo);
  } catch (err) {
    next(err);
  }
};

export const createModelo = async (req, res, next) => {
  try {
    const { nombre, marca, descripcion, puffs, costo, precioVendedor, precioSugerido, mostrarPrecio } = req.body;
    if (!nombre || !marca || !puffs || !costo || !precioVendedor || !precioSugerido) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const modelo = await prisma.vapeModelo.create({
      data: {
        nombre,
        marca,
        descripcion,
        puffs: parseInt(puffs),
        costo: parseFloat(costo),
        precioVendedor: parseFloat(precioVendedor),
        precioSugerido: parseFloat(precioSugerido),
        mostrarPrecio: mostrarPrecio !== false && mostrarPrecio !== 'false',
        imagenUrl,
      },
      include: modeloInclude,
    });
    res.status(201).json(modelo);
  } catch (err) {
    next(err);
  }
};

export const updateModelo = async (req, res, next) => {
  try {
    const { nombre, marca, descripcion, puffs, costo, precioVendedor, precioSugerido, mostrarPrecio, activo } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (marca !== undefined) data.marca = marca;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (puffs !== undefined) data.puffs = parseInt(puffs);
    if (costo !== undefined) data.costo = parseFloat(costo);
    if (precioVendedor !== undefined) data.precioVendedor = parseFloat(precioVendedor);
    if (precioSugerido !== undefined) data.precioSugerido = parseFloat(precioSugerido);
    if (mostrarPrecio !== undefined) data.mostrarPrecio = mostrarPrecio !== false && mostrarPrecio !== 'false';
    if (activo !== undefined) data.activo = activo !== false && activo !== 'false';
    if (req.file) data.imagenUrl = `/uploads/${req.file.filename}`;

    const modelo = await prisma.vapeModelo.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: modeloInclude,
    });
    res.json(modelo);
  } catch (err) {
    next(err);
  }
};

export const addVariante = async (req, res, next) => {
  try {
    const modeloId = parseInt(req.params.id);
    const { sabor, stock } = req.body;
    if (!sabor) return res.status(400).json({ error: 'El sabor es requerido' });

    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const variante = await prisma.vapeVariante.create({
      data: {
        modeloId,
        sabor,
        imagenUrl,
        stock: stock ? parseInt(stock) : 0,
      },
    });
    res.status(201).json(variante);
  } catch (err) {
    next(err);
  }
};

export const updateVariante = async (req, res, next) => {
  try {
    const { sabor, stock, activo } = req.body;
    const data = {};
    if (sabor !== undefined) data.sabor = sabor;
    if (stock !== undefined) data.stock = parseInt(stock);
    if (activo !== undefined) data.activo = activo;
    if (req.file) data.imagenUrl = `/uploads/${req.file.filename}`;

    const variante = await prisma.vapeVariante.update({
      where: { id: parseInt(req.params.varianteId) },
      data,
    });
    res.json(variante);
  } catch (err) {
    next(err);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { cantidad, operacion } = req.body; // operacion: 'add' | 'set'
    const id = parseInt(req.params.varianteId);
    const variante = await prisma.vapeVariante.findUnique({ where: { id } });
    if (!variante) return res.status(404).json({ error: 'Variante no encontrada' });

    const nuevoStock = operacion === 'set'
      ? parseInt(cantidad)
      : variante.stock + parseInt(cantidad);

    if (nuevoStock < 0) return res.status(400).json({ error: 'Stock no puede ser negativo' });

    const updated = await prisma.vapeVariante.update({
      where: { id },
      data: { stock: nuevoStock },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
