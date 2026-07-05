import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import vapeRoutes from './routes/vape.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import salesRoutes from './routes/sales.routes.js';
import liquidationRoutes from './routes/liquidation.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import fidelityRoutes from './routes/fidelity.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vapes', vapeRoutes);
app.use('/api/inventario', inventoryRoutes);
app.use('/api/ventas', salesRoutes);
app.use('/api/liquidaciones', liquidationRoutes);
app.use('/api/suscripciones', subscriptionRoutes);
app.use('/api/fidelidad', fidelityRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

export default app;
