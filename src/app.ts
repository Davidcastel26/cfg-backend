import cors from 'cors';
import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes';
import healthRouter from './routes/health';
import { errorHandler, notFound } from './utils/http';
import { logger } from './utils/logger';
import { buildOpenApiSpec } from './utils/swagger';

/** Express application factory. */
export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [
    'http://localhost:5173',
    'http://localhost:4173',
  ];
  app.use(cors({ origin: corsOrigins, credentials: true }));

  app.use(pinoHttp({ logger }));
  // Only application/json; the import route's express.raw handles octet-stream.
  app.use(express.json({ limit: '5mb' }));

  app.use('/health', healthRouter);

  const spec = buildOpenApiSpec();
  app.get('/api-docs.json', (_req, res) => {
    res.json(spec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
