import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { generalLimiter } from './middlewares/rateLimit.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { treesRouter } from './modules/trees/trees.routes.js';
import { personsRouter } from './modules/persons/persons.routes.js';
import { relationshipsRouter } from './modules/relationships/relationships.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { medicalRouter } from './modules/medical/medical.routes.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(generalLimiter);

  app.use('/health', healthRouter);
  // Rutas específicas primero (más específicas → más generales)
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/trees', treesRouter);
  app.use('/api/relationships', relationshipsRouter);
  app.use('/api/catalog', catalogRouter);
  // Los routers que usan rutas con prefijo /api (persons, medical) van al final
  // porque su `router.use(authenticate)` interceptaría las anteriores.
  app.use('/api', personsRouter); // /api/:treeId/persons y /api/persons/:id
  app.use('/api', medicalRouter); // /api/persons/:id/{conditions,allergies,habits}

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
