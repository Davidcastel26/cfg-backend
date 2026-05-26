import { Router } from 'express';
import * as product from '../controllers/productController';
import { asyncHandler, validate } from '../utils/http';
import { catalogListQuery } from '../validators/catalog';
import { idParam } from '../validators/common';

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products (paginated, searchable)
 *     tags: [Products]
 *     responses: { 200: { description: Paginated products } }
 * /products/{id}:
 *   get:
 *     summary: Get a product
 *     tags: [Products]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Product }, 404: { $ref: '#/components/responses/NotFound' } }
 */
router.get('/', validate({ query: catalogListQuery }), asyncHandler(product.list));
router.get('/:id', validate({ params: idParam }), asyncHandler(product.getById));

export default router;
