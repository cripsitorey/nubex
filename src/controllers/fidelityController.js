import { prisma } from '../prisma.js';

export const getConfig = async (req, res, next) => {
  try {
    const configs = await prisma.configFidelidad.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(configs);
  } catch (err) {
    next(err);
  }
};

export const createConfig = async (req, res, next) => {
  try {
    const { comprasNecesarias, tipoRecompensa, valorDescuento } = req.body;
    // Desactivar config anterior
    await prisma.configFidelidad.updateMany({ where: { activo: true }, data: { activo: false } });
    const config = await prisma.configFidelidad.create({
      data: {
        comprasNecesarias: parseInt(comprasNecesarias),
        tipoRecompensa,
        valorDescuento: valorDescuento ? parseFloat(valorDescuento) : null,
      },
    });
    res.status(201).json(config);
  } catch (err) {
    next(err);
  }
};

export const getLogros = async (req, res, next) => {
  try {
    const clienteId = req.user.role === 'CLIENTE' ? req.user.id : parseInt(req.params.clienteId);
    const logros = await prisma.logroFidelidad.findMany({
      where: { clienteId },
      include: { config: true },
      orderBy: { obtenidoEn: 'desc' },
    });
    res.json(logros);
  } catch (err) {
    next(err);
  }
};

export const reclamarLogro = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const logro = await prisma.logroFidelidad.findUnique({ where: { id } });
    if (!logro) return res.status(404).json({ error: 'Logro no encontrado' });
    if (logro.reclamado) return res.status(400).json({ error: 'Logro ya reclamado' });
    if (req.user.role === 'CLIENTE' && logro.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const updated = await prisma.logroFidelidad.update({
      where: { id },
      data: { reclamado: true, reclamadoEn: new Date() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
