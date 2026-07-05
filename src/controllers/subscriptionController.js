import { prisma } from '../prisma.js';

// ─── PLANES ───────────────────────────────────────────────────────────────────

export const getPlanes = async (req, res, next) => {
  try {
    const planes = await prisma.planSuscripcion.findMany({
      where: req.query.soloActivos !== 'false' ? { activo: true } : {},
      include: { vapesPermitidos: { include: { modelo: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(planes);
  } catch (err) {
    next(err);
  }
};

export const createPlan = async (req, res, next) => {
  try {
    const {
      nombre, descripcion, tipo, valorLimite, maxPuffsPermitidosPorVape,
      diasEntreEntregas, precio, todosLosVapes, penalizacionPorDia,
      diasGraciaDevolucion, modelosPermitidosIds,
    } = req.body;

    const plan = await prisma.planSuscripcion.create({
      data: {
        nombre,
        descripcion,
        tipo,
        valorLimite: parseInt(valorLimite),
        maxPuffsPermitidosPorVape: maxPuffsPermitidosPorVape ? parseInt(maxPuffsPermitidosPorVape) : null,
        diasEntreEntregas: parseInt(diasEntreEntregas),
        precio: parseFloat(precio),
        todosLosVapes: todosLosVapes !== false,
        penalizacionPorDia: parseFloat(penalizacionPorDia || 0),
        diasGraciaDevolucion: parseInt(diasGraciaDevolucion || 7),
        vapesPermitidos: !todosLosVapes && modelosPermitidosIds?.length
          ? { create: modelosPermitidosIds.map((id) => ({ modeloId: parseInt(id) })) }
          : undefined,
      },
      include: { vapesPermitidos: { include: { modelo: true } } },
    });
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const {
      nombre, descripcion, tipo, valorLimite, maxPuffsPermitidosPorVape,
      diasEntreEntregas, precio, todosLosVapes, penalizacionPorDia,
      diasGraciaDevolucion, activo, modelosPermitidosIds,
    } = req.body;

    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (tipo !== undefined) data.tipo = tipo;
    if (valorLimite !== undefined) data.valorLimite = parseInt(valorLimite);
    if (maxPuffsPermitidosPorVape !== undefined) data.maxPuffsPermitidosPorVape = maxPuffsPermitidosPorVape ? parseInt(maxPuffsPermitidosPorVape) : null;
    if (diasEntreEntregas !== undefined) data.diasEntreEntregas = parseInt(diasEntreEntregas);
    if (precio !== undefined) data.precio = parseFloat(precio);
    if (todosLosVapes !== undefined) data.todosLosVapes = todosLosVapes;
    if (penalizacionPorDia !== undefined) data.penalizacionPorDia = parseFloat(penalizacionPorDia);
    if (diasGraciaDevolucion !== undefined) data.diasGraciaDevolucion = parseInt(diasGraciaDevolucion);
    if (activo !== undefined) data.activo = activo;

    if (modelosPermitidosIds !== undefined) {
      await prisma.planVapeModelo.deleteMany({ where: { planId: id } });
      if (!todosLosVapes && modelosPermitidosIds.length) {
        data.vapesPermitidos = { create: modelosPermitidosIds.map((mid) => ({ modeloId: parseInt(mid) })) };
      }
    }

    const plan = await prisma.planSuscripcion.update({
      where: { id },
      data,
      include: { vapesPermitidos: { include: { modelo: true } } },
    });
    res.json(plan);
  } catch (err) {
    next(err);
  }
};

// ─── SUSCRIPCIONES ────────────────────────────────────────────────────────────

export const getSuscripciones = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'CLIENTE') {
      where.clienteId = req.user.id;
    } else if (req.query.clienteId) {
      where.clienteId = parseInt(req.query.clienteId);
    }
    if (req.query.activa !== undefined) where.activa = req.query.activa === 'true';

    const suscripciones = await prisma.suscripcion.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        plan: { select: { id: true, nombre: true } },
        vapesPermitidos: { include: { modelo: { include: { variantes: { where: { activo: true } } } } } },
        entregas: {
          orderBy: { fechaEntrega: 'desc' },
          take: 1,
          include: { variante: { include: { modelo: true } } },
        },
      },
    });
    res.json(req.user.role === 'CLIENTE' ? suscripciones[0] || null : suscripciones);
  } catch (err) {
    next(err);
  }
};

export const suscribir = async (req, res, next) => {
  try {
    const { clienteId, planId, multaFijaAdicional } = req.body;
    if (!clienteId || !planId) return res.status(400).json({ error: 'clienteId y planId requeridos' });

    const plan = await prisma.planSuscripcion.findUnique({
      where: { id: parseInt(planId) },
      include: { vapesPermitidos: true },
    });
    if (!plan || !plan.activo) return res.status(400).json({ error: 'Plan no encontrado o inactivo' });

    const suscripcion = await prisma.suscripcion.create({
      data: {
        clienteId: parseInt(clienteId),
        planId: parseInt(planId),
        tipo: plan.tipo,
        valorLimite: plan.valorLimite,
        maxPuffsPermitidosPorVape: plan.maxPuffsPermitidosPorVape,
        diasEntreEntregas: plan.diasEntreEntregas,
        precio: plan.precio,
        todosLosVapes: plan.todosLosVapes,
        penalizacionPorDia: plan.penalizacionPorDia,
        diasGraciaDevolucion: plan.diasGraciaDevolucion,
        multaFijaAdicional: multaFijaAdicional ? parseFloat(multaFijaAdicional) : null,
        vapesPermitidos: !plan.todosLosVapes
          ? { create: plan.vapesPermitidos.map((v) => ({ modeloId: v.modeloId })) }
          : undefined,
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        plan: { select: { id: true, nombre: true } },
        vapesPermitidos: { include: { modelo: true } },
      },
    });
    res.status(201).json(suscripcion);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'El cliente ya tiene una suscripción activa' });
    next(err);
  }
};

export const cancelarSuscripcion = async (req, res, next) => {
  try {
    const suscripcion = await prisma.suscripcion.update({
      where: { id: parseInt(req.params.id) },
      data: { activa: false },
    });
    res.json(suscripcion);
  } catch (err) {
    next(err);
  }
};

// ─── ENTREGAS ─────────────────────────────────────────────────────────────────

export const registrarEntrega = async (req, res, next) => {
  try {
    const suscripcionId = parseInt(req.params.id);
    const { varianteId, vapeAnteriorDevuelto, notas, multaManual } = req.body;

    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id: suscripcionId },
      include: { entregas: { orderBy: { fechaEntrega: 'desc' }, take: 1 } },
    });
    if (!suscripcion || !suscripcion.activa) {
      return res.status(400).json({ error: 'Suscripción no encontrada o inactiva' });
    }

    // Calcular multa si no devolvió el vape
    let multaAplicada = 0;
    const ultimaEntrega = suscripcion.entregas[0];
    if (ultimaEntrega && !vapeAnteriorDevuelto) {
      if (multaManual !== undefined) {
        multaAplicada = parseFloat(multaManual);
      } else {
        const hoy = new Date();
        const limiteDevolucion = new Date(ultimaEntrega.fechaLimiteDevolucion);
        if (hoy > limiteDevolucion) {
          const diasDeRetraso = Math.ceil((hoy - limiteDevolucion) / (1000 * 60 * 60 * 24));
          multaAplicada = diasDeRetraso * suscripcion.penalizacionPorDia;
        }
        if (suscripcion.multaFijaAdicional) multaAplicada += suscripcion.multaFijaAdicional;
      }
    }

    const fechaEntrega = new Date();
    const fechaLimiteDevolucion = new Date(fechaEntrega);
    fechaLimiteDevolucion.setDate(fechaLimiteDevolucion.getDate() + suscripcion.diasGraciaDevolucion);

    const fechaProximaEntrega = new Date(fechaEntrega);
    fechaProximaEntrega.setDate(fechaProximaEntrega.getDate() + suscripcion.diasEntreEntregas);

    const entrega = await prisma.entregaSuscripcion.create({
      data: {
        suscripcionId,
        varianteId: parseInt(varianteId),
        entregadoPorId: req.user.id,
        verificadoPorId: req.user.id,
        vapeAnteriorDevuelto: !!vapeAnteriorDevuelto,
        multaAplicada,
        fechaEntrega,
        fechaLimiteDevolucion,
        fechaProximaEntrega,
        notas,
      },
      include: {
        variante: { include: { modelo: true } },
        entregadoPor: { select: { id: true, nombre: true } },
      },
    });

    res.status(201).json({ entrega, multaAplicada });
  } catch (err) {
    next(err);
  }
};

export const getEntregas = async (req, res, next) => {
  try {
    const suscripcionId = parseInt(req.params.id);
    const entregas = await prisma.entregaSuscripcion.findMany({
      where: { suscripcionId },
      include: {
        variante: { include: { modelo: true } },
        entregadoPor: { select: { id: true, nombre: true } },
        verificadoPor: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaEntrega: 'desc' },
    });
    res.json(entregas);
  } catch (err) {
    next(err);
  }
};
