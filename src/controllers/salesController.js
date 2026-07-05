import { prisma } from '../prisma.js';

const calcularReparto = (totalVenta, vape, repartoOverride, role) => {
  if (role === 'ADMIN') {
    return { tipo: 'PRECIO_FIJO', valor: totalVenta, montoParaAdmin: totalVenta, montoParaVendedor: 0 };
  }
  if (repartoOverride) {
    const valor = parseFloat(repartoOverride.valor);
    const tipo = repartoOverride.tipo;
    const montoParaAdmin = tipo === 'PORCENTAJE'
      ? totalVenta * (valor / 100)
      : valor * (totalVenta / (parseFloat(repartoOverride.precioVenta) || totalVenta));
    return { tipo, valor, montoParaAdmin, montoParaVendedor: totalVenta - montoParaAdmin };
  }
  // fallback: precio base del modelo
  const montoParaAdmin = vape.modelo.precioVendedor * (totalVenta / (totalVenta || 1));
  return { tipo: 'PRECIO_FIJO', valor: vape.modelo.precioVendedor, montoParaAdmin: vape.modelo.precioVendedor, montoParaVendedor: totalVenta - vape.modelo.precioVendedor };
};

export const createVenta = async (req, res, next) => {
  try {
    const vendedorId = req.user.id;
    const {
      clienteId, varianteId, cantidad, precioVenta,
      pagadoA, metodoPago, reparto, esGarantia, notas,
      descuentoAdmin = 0, descuentoVendedor = 0,
    } = req.body;

    const cantidadInt = parseInt(cantidad);
    const esGarantiaFinal = req.user.role === 'ADMIN' && (esGarantia === true || esGarantia === 'true');

    if (!varianteId || !cantidadInt || cantidadInt <= 0) {
      return res.status(400).json({ error: 'varianteId y cantidad son requeridos' });
    }
    if (!esGarantiaFinal && (precioVenta === undefined || isNaN(parseFloat(precioVenta)))) {
      return res.status(400).json({ error: 'precioVenta es requerido' });
    }

    const comprobanteUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const venta = await prisma.$transaction(async (tx) => {
      const variante = await tx.vapeVariante.findUnique({
        where: { id: parseInt(varianteId) },
        include: { modelo: true },
      });
      if (!variante) throw new Error('Variante no encontrada');

      if (req.user.role === 'ADMIN') {
        if (variante.stock < cantidadInt) throw new Error('Stock insuficiente en bodega');
        await tx.vapeVariante.update({
          where: { id: parseInt(varianteId) },
          data: { stock: { decrement: cantidadInt } },
        });
      } else {
        const inv = await tx.inventarioVendedor.findUnique({
          where: { vendedorId_varianteId: { vendedorId, varianteId: parseInt(varianteId) } },
        });
        if (!inv || inv.cantidad < cantidadInt) throw new Error('Stock insuficiente en tu inventario');
        await tx.inventarioVendedor.update({
          where: { vendedorId_varianteId: { vendedorId, varianteId: parseInt(varianteId) } },
          data: { cantidad: { decrement: cantidadInt } },
        });
      }

      const precioVentaFinal = esGarantiaFinal ? 0 : parseFloat(precioVenta);
      const totalVenta = precioVentaFinal * cantidadInt;

      let montoParaAdmin = 0, montoParaVendedor = 0, repartoTipo = 'PRECIO_FIJO', repartoValor = 0;

      if (!esGarantiaFinal) {
        if (req.user.role === 'ADMIN') {
          montoParaAdmin = totalVenta;
          repartoTipo = 'PRECIO_FIJO';
          repartoValor = totalVenta;
        } else if (reparto) {
          repartoTipo = reparto.tipo;
          repartoValor = parseFloat(reparto.valor);
          montoParaAdmin = repartoTipo === 'PORCENTAJE'
            ? totalVenta * (repartoValor / 100)
            : repartoValor * cantidadInt;
          montoParaVendedor = totalVenta - montoParaAdmin;
        } else {
          // Usar comisión default del vendedor o precio base del modelo
          const comision = await tx.comisionVendedor.findUnique({ where: { vendedorId } });
          if (comision) {
            repartoTipo = comision.tipo;
            repartoValor = comision.valor;
            montoParaAdmin = comision.tipo === 'PORCENTAJE'
              ? totalVenta * (comision.valor / 100)
              : comision.valor * cantidadInt;
          } else {
            repartoTipo = 'PRECIO_FIJO';
            repartoValor = variante.modelo.precioVendedor;
            montoParaAdmin = variante.modelo.precioVendedor * cantidadInt;
          }
          montoParaVendedor = totalVenta - montoParaAdmin;
        }
        montoParaAdmin -= parseFloat(descuentoAdmin);
        montoParaVendedor -= parseFloat(descuentoVendedor);
      }

      const nuevaVenta = await tx.venta.create({
        data: {
          vendedorId,
          clienteId: clienteId ? parseInt(clienteId) : null,
          varianteId: parseInt(varianteId),
          cantidad: cantidadInt,
          costoAdquisicion: variante.modelo.costo,
          precioVenta: precioVentaFinal,
          repartoTipo,
          repartoValor,
          montoParaAdmin,
          montoParaVendedor,
          descuentoAdmin: parseFloat(descuentoAdmin),
          descuentoVendedor: parseFloat(descuentoVendedor),
          pagadoA: req.user.role === 'ADMIN' ? 'ADMIN' : (pagadoA || 'VENDEDOR'),
          metodoPago: metodoPago || 'EFECTIVO',
          estado: esGarantiaFinal ? 'GARANTIA' : 'PENDIENTE_LIQUIDACION',
          comprobanteUrl,
          notas,
        },
        include: {
          variante: { include: { modelo: true } },
          cliente: { select: { id: true, nombre: true } },
        },
      });

      // Fidelidad
      let alertaFidelidad = null;
      if (clienteId && !esGarantiaFinal) {
        const config = await tx.configFidelidad.findFirst({ where: { activo: true }, orderBy: { createdAt: 'desc' } });
        if (config) {
          const cliente = await tx.user.update({
            where: { id: parseInt(clienteId) },
            data: { ventasComoCliente: undefined }, // solo update contador
          });
          // Contar ventas del cliente (sin garantías)
          const totalCompras = await tx.venta.count({
            where: { clienteId: parseInt(clienteId), estado: { not: 'GARANTIA' } },
          });
          const logrosYaObtenidos = await tx.logroFidelidad.count({ where: { clienteId: parseInt(clienteId) } });
          const logrosQueDebeTener = Math.floor(totalCompras / config.comprasNecesarias);

          if (logrosQueDebeTener > logrosYaObtenidos) {
            await tx.logroFidelidad.create({
              data: {
                clienteId: parseInt(clienteId),
                configId: config.id,
                nombre: config.tipoRecompensa === 'VAPE_GRATIS' ? 'Vape Gratis' : `Descuento $${config.valorDescuento}`,
                descripcion: `Alcanzó ${totalCompras} compras.`,
              },
            });
            alertaFidelidad = config.tipoRecompensa === 'VAPE_GRATIS'
              ? `¡El cliente tiene derecho a un vape gratis! (${totalCompras} compras acumuladas)`
              : `¡El cliente tiene un descuento de $${config.valorDescuento}!`;
          }
        }
      }

      return { venta: nuevaVenta, alertaFidelidad };
    });

    res.status(201).json(venta);
  } catch (err) {
    if (['Stock insuficiente en bodega', 'Stock insuficiente en tu inventario', 'Variante no encontrada'].includes(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const getVentas = async (req, res, next) => {
  try {
    const { vendedorId, clienteId, estado, desde, hasta, page = 1, limit = 50 } = req.query;
    const where = {};

    if (req.user.role === 'VENDEDOR') {
      where.vendedorId = req.user.id;
    } else {
      if (vendedorId) where.vendedorId = parseInt(vendedorId);
      if (clienteId) where.clienteId = parseInt(clienteId);
    }
    if (estado) where.estado = estado;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    const [ventas, total] = await Promise.all([
      prisma.venta.findMany({
        where,
        include: {
          vendedor: { select: { id: true, nombre: true } },
          cliente: { select: { id: true, nombre: true, telefono: true } },
          variante: { include: { modelo: { select: { id: true, nombre: true, marca: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.venta.count({ where }),
    ]);

    res.json({ data: ventas, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

export const updateVenta = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { pagadoA, estado, notas } = req.body;
    const data = {};
    if (pagadoA) data.pagadoA = pagadoA;
    if (estado) data.estado = estado;
    if (notas !== undefined) data.notas = notas;

    const venta = await prisma.venta.update({ where: { id }, data });
    res.json(venta);
  } catch (err) {
    next(err);
  }
};
