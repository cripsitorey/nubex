import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso restringido a administradores' });
    }
    next();
  });
};

export const requireVendedor = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'VENDEDOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acceso restringido a vendedores' });
    }
    next();
  });
};
