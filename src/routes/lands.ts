import { Router } from 'express';
import * as land from '../controllers/landController';
import { asyncHandler, validate } from '../utils/http';
import { catalogListQuery } from '../validators/catalog';
import { idParam } from '../validators/common';

const router = Router();

/**
 * @swagger
 * /lands:
 *   get:
 *     summary: List lands (paginated, searchable)
 *     tags: [Lands]
 *     responses: { 200: { description: Paginated lands } }
 * /lands/{id}:
 *   get:
 *     summary: Get a land
 *     tags: [Lands]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Land }, 404: { $ref: '#/components/responses/NotFound' } }
 */
router.get('/', validate({ query: catalogListQuery }), asyncHandler(land.list));
router.get('/:id', validate({ params: idParam }), asyncHandler(land.getById));

export default router;
