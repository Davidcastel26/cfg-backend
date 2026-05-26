import { Router } from 'express';
import * as payment from '../controllers/paymentController';
import { asyncHandler, validate } from '../utils/http';
import { weeklyQuery, weeklySupplierParams, weeksRangeQuery } from '../validators/payment';

const router = Router();

/**
 * @swagger
 * /payments/weekly:
 *   get:
 *     summary: Aggregated payment summary for one ISO week
 *     tags: [Payments]
 *     parameters:
 *       - { in: query, name: isoYear, required: true, schema: { type: integer, example: 2023 } }
 *       - { in: query, name: isoWeek, required: true, schema: { type: integer, example: 5 } }
 *     responses:
 *       200:
 *         description: Weekly payment summary
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WeeklyPaymentSummary' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 * /payments/weeks:
 *   get:
 *     summary: List ISO weeks that contain tickets
 *     tags: [Payments]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, example: '2023-01' } }
 *       - { in: query, name: to, schema: { type: string, example: '2023-09' } }
 *     responses: { 200: { description: Available weeks } }
 * /payments/weekly/{isoYear}/{isoWeek}/suppliers/{supplierId}:
 *   get:
 *     summary: Weekly summary drilled down to one supplier
 *     tags: [Payments]
 *     parameters:
 *       - { in: path, name: isoYear, required: true, schema: { type: integer } }
 *       - { in: path, name: isoWeek, required: true, schema: { type: integer } }
 *       - { in: path, name: supplierId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Weekly payment summary for the supplier
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WeeklyPaymentSummary' }
 */
router.get('/weekly', validate({ query: weeklyQuery }), asyncHandler(payment.weekly));
router.get('/weeks', validate({ query: weeksRangeQuery }), asyncHandler(payment.weeks));
router.get(
  '/weekly/:isoYear/:isoWeek/suppliers/:supplierId',
  validate({ params: weeklySupplierParams }),
  asyncHandler(payment.weeklySupplier),
);

export default router;
