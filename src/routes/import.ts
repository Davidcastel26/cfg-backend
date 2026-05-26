import express, { Router } from 'express';
import * as importController from '../controllers/importController';
import { asyncHandler } from '../utils/http';

const router = Router();

/**
 * @swagger
 * /import/excel:
 *   post:
 *     summary: Idempotent ingestion of a tickets .xlsx
 *     description: Send the raw spreadsheet bytes as the body (application/octet-stream).
 *     tags: [Import]
 *     requestBody:
 *       required: true
 *       content:
 *         application/octet-stream:
 *           schema: { type: string, format: binary }
 *     responses:
 *       200: { description: Import summary }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/excel', express.raw({ type: () => true, limit: '25mb' }), asyncHandler(importController.importExcel));

export default router;
