import { Router } from 'express';
import { sequelize } from '../models';
import { asyncHandler } from '../utils/http';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness + DB readiness probe
 *     tags: [Health]
 *     responses:
 *       200: { description: Service healthy }
 *       503: { description: Database unreachable }
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      await sequelize.authenticate();
      res.json({ status: 'ok', db: 'up', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'down', timestamp: new Date().toISOString() });
    }
  }),
);

export default router;
