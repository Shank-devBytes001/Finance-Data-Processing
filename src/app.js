import express from 'express';
import { AppError, errorHandler } from './utils/apiError.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import recordsRoutes from './routes/records.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import docsRoutes from './routes/docs.routes.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api-docs', docsRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, _res, next) => {
  next(new AppError(404, `Not found: ${req.method} ${req.path}`));
});

app.use(errorHandler);

export default app;
