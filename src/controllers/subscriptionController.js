import { prisma } from '../prisma.js';

export const deliverSubscription = async (req, res, next) => {
  try {
    const vendedorId = req.user.id;
    const { clienteId, vapeId, confirmarMulta, multaPersonalizada } = req.body;

    if (!clienteId || !vapeId) {
      return res.status(400).json({ error: 'Faltan parámetros: clienteId, vapeId' });
    }

    const suscripcion = await prisma.suscripcion.findUnique({
      where: { clienteId: parseInt(clienteId) },
      include: {
        entregas: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!suscripcion || !suscripcion.activa) {
      return res.status(400).json({ error: 'El cliente no tiene una suscripción activa' });
    }

    const vape = await prisma.vape.findUnique({ where: { id: parseInt(vapeId) } });
    if (!vape) {
      return res.status(404).json({ error: 'Vape no encontrado' });
    }

    // Verificar días desde última entrega dinámicamente
    const DIAS_MINIMOS = suscripcion.diasEntreEntregas;
    let multaSugerida = 0;
    let aplicarMulta = false;

    if (suscripcion.entregas.length > 0) {
      const ultimaEntrega = suscripcion.entregas[0].createdAt;
      const hoy = new Date();
      const diffTime = Math.abs(hoy - ultimaEntrega);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < DIAS_MINIMOS) {
        const diasFaltantes = DIAS_MINIMOS - diffDays;
        
        // Calcular multa sugerida
        if (suscripcion.multaFija !== null && suscripcion.multaFija !== undefined) {
          multaSugerida = suscripcion.multaFija;
        } else {
          // Prorrateo basado en el costo del vape y los días faltantes
          multaSugerida = (diasFaltantes / DIAS_MINIMOS) * vape.costo;
        }

        // Si el vendedor quiere forzar una multa específica
        if (multaPersonalizada !== undefined) {
          multaSugerida = parseFloat(multaPersonalizada);
        }

        if (!confirmarMulta) {
          return res.status(400).json({
            requiereMulta: true,
            multaSugerida: parseFloat(multaSugerida.toFixed(2)),
            diasFaltantes,
            mensaje: `El cliente solicitó entrega antes del límite (${DIAS_MINIMOS} días). Faltan ${diasFaltantes} días. Se sugiere cobrar multa.`
          });
        } else {
          aplicarMulta = true;
        }
      }
    }

    // Usar transacción para verificar stock y registrar entrega
    const entrega = await prisma.$transaction(async (prismaClient) => {
      // 1. Verificar stock del vendedor
      const inventario = await prismaClient.inventarioVendedor.findUnique({
        where: {
          vendedorId_vapeId: {
            vendedorId: parseInt(vendedorId),
            vapeId: parseInt(vapeId)
          }
        }
      });

      if (!inventario || inventario.cantidad < 1) {
        throw new Error('No tienes stock suficiente para entregar este vape');
      }

      // 2. Restar stock
      await prismaClient.inventarioVendedor.update({
        where: {
          vendedorId_vapeId: {
            vendedorId: parseInt(vendedorId),
            vapeId: parseInt(vapeId)
          }
        },
        data: {
          cantidad: inventario.cantidad - 1
        }
      });

      // 3. Crear registro de EntregaSuscripcion
      const nuevaEntrega = await prismaClient.entregaSuscripcion.create({
        data: {
          suscripcionId: suscripcion.id,
          vendedorId: parseInt(vendedorId),
          vapeId: parseInt(vapeId),
          multaAplicada: aplicarMulta ? parseFloat(multaSugerida.toFixed(2)) : 0
        }
      });

      return nuevaEntrega;
    });

    res.status(201).json({
      message: 'Vape entregado por suscripción exitosamente',
      entrega
    });
  } catch (error) {
    if (error.message === 'No tienes stock suficiente para entregar este vape') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

export const getPlans = async (req, res, next) => {
  try {
    const planes = await prisma.planSuscripcion.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(planes);
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req, res, next) => {
  try {
    const { nombre, diasEntreEntregas, precio, limiteVapes } = req.body;
    const plan = await prisma.planSuscripcion.create({
      data: {
        nombre,
        diasEntreEntregas: parseInt(diasEntreEntregas),
        precio: parseFloat(precio),
        limiteVapes: limiteVapes ? parseInt(limiteVapes) : null
      }
    });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, diasEntreEntregas, precio, limiteVapes } = req.body;
    const plan = await prisma.planSuscripcion.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        diasEntreEntregas: parseInt(diasEntreEntregas),
        precio: parseFloat(precio),
        limiteVapes: limiteVapes ? parseInt(limiteVapes) : null
      }
    });
    res.json(plan);
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.planSuscripcion.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Plan eliminado' });
  } catch (error) {
    next(error);
  }
};
