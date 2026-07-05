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
        solicitudes: {
          where: { estado: 'PENDIENTE' },
          orderBy: { createdAt: 'desc' },
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

// Valida que el vape elegido respete las reglas de la suscripción (snapshot
// congelado al momento de contratar): si no es "todos los vapes", el modelo
// debe estar en la lista permitida, y si hay tope de puffs, no puede excederlo.
async function validarVarianteParaSuscripcion(suscripcion, varianteId) {
  const variante = await prisma.vapeVariante.findUnique({
    where: { id: parseInt(varianteId) },
    include: { modelo: true },
  });
  if (!variante) throw new Error('Variante no encontrada');

  if (!suscripcion.todosLosVapes) {
    const permitidos = await prisma.suscripcionVapePermitido.findMany({ where: { suscripcionId: suscripcion.id } });
    if (!permitidos.some((p) => p.modeloId === variante.modeloId)) {
      throw new Error('Ese modelo de vape no está permitido en tu plan');
    }
  }
  if (suscripcion.maxPuffsPermitidosPorVape && variante.modelo.puffs > suscripcion.maxPuffsPermitidosPorVape) {
    throw new Error(`Ese vape excede el máximo de ${suscripcion.maxPuffsPermitidosPorVape} puffs de tu plan`);
  }
  return variante;
}

export const registrarEntrega = async (req, res, next) => {
  try {
    const suscripcionId = parseInt(req.params.id);
    const { varianteId, vapeAnteriorDevuelto, notas, multaManual, solicitudId } = req.body;

    const suscripcion = await prisma.suscripcion.findUnique({
      where: { id: suscripcionId },
      include: { entregas: { orderBy: { fechaEntrega: 'desc' }, take: 1 } },
    });
    if (!suscripcion || !suscripcion.activa) {
      return res.status(400).json({ error: 'Suscripción no encontrada o inactiva' });
    }

    const variante = await validarVarianteParaSuscripcion(suscripcion, varianteId);

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

    const entrega = await prisma.$transaction(async (tx) => {
      if (req.user.role === 'ADMIN') {
        if (variante.stock < 1) throw new Error('Stock insuficiente en bodega');
        await tx.vapeVariante.update({ where: { id: variante.id }, data: { stock: { decrement: 1 } } });
      } else {
        const inv = await tx.inventarioVendedor.findUnique({
          where: { vendedorId_varianteId: { vendedorId: req.user.id, varianteId: variante.id } },
        });
        if (!inv || inv.cantidad < 1) throw new Error('Stock insuficiente en tu inventario');
        await tx.inventarioVendedor.update({
          where: { vendedorId_varianteId: { vendedorId: req.user.id, varianteId: variante.id } },
          data: { cantidad: { decrement: 1 } },
        });
      }

      const nuevaEntrega = await tx.entregaSuscripcion.create({
        data: {
          suscripcionId,
          varianteId: variante.id,
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

      if (solicitudId) {
        await tx.solicitudEntrega.update({
          where: { id: parseInt(solicitudId) },
          data: { estado: 'APROBADA', resueltaEn: new Date(), entregaId: nuevaEntrega.id },
        });
      }

      return nuevaEntrega;
    });

    res.status(201).json({ entrega, multaAplicada });
  } catch (err) {
    if (['Variante no encontrada', 'Stock insuficiente en bodega', 'Stock insuficiente en tu inventario'].includes(err.message)
      || err.message.startsWith('Ese modelo') || err.message.startsWith('Ese vape')) {
      return res.status(400).json({ error: err.message });
    }
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

// ─── SOLICITUDES DE ENTREGA ───────────────────────────────────────────────────

// El cliente pide "se me acabó, quiero uno nuevo" seleccionando el sabor.
export const solicitarEntrega = async (req, res, next) => {
  try {
    const suscripcionId = parseInt(req.params.id);
    const { varianteId, notas } = req.body;
    if (!varianteId) return res.status(400).json({ error: 'varianteId es requerido' });

    const suscripcion = await prisma.suscripcion.findUnique({ where: { id: suscripcionId } });
    if (!suscripcion || !suscripcion.activa) {
      return res.status(400).json({ error: 'Suscripción no encontrada o inactiva' });
    }
    if (req.user.role === 'CLIENTE' && suscripcion.clienteId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const yaHayPendiente = await prisma.solicitudEntrega.findFirst({
      where: { suscripcionId, estado: 'PENDIENTE' },
    });
    if (yaHayPendiente) {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente de revisión' });
    }

    await validarVarianteParaSuscripcion(suscripcion, varianteId);

    const solicitud = await prisma.solicitudEntrega.create({
      data: { suscripcionId, varianteId: parseInt(varianteId), notas },
      include: { variante: { include: { modelo: true } } },
    });
    res.status(201).json(solicitud);
  } catch (err) {
    if (err.message.startsWith('Ese modelo') || err.message.startsWith('Ese vape') || err.message === 'Variante no encontrada') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const getSolicitudesPendientes = async (req, res, next) => {
  try {
    const solicitudes = await prisma.solicitudEntrega.findMany({
      where: { estado: 'PENDIENTE' },
      include: {
        variante: { include: { modelo: true } },
        suscripcion: { include: { cliente: { select: { id: true, nombre: true, telefono: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(solicitudes);
  } catch (err) {
    next(err);
  }
};

export const rechazarSolicitud = async (req, res, next) => {
  try {
    const solicitud = await prisma.solicitudEntrega.update({
      where: { id: parseInt(req.params.id) },
      data: { estado: 'RECHAZADA', resueltaEn: new Date(), notas: req.body.notas },
    });
    res.json(solicitud);
  } catch (err) {
    next(err);
  }
};
