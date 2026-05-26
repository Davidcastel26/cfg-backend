import { Router } from 'express';
import * as supplier from '../controllers/supplierController';
import { asyncHandler, validate } from '../utils/http';
import { catalogListQuery, createCatalog, updateCatalog } from '../validators/catalog';
import { idParam } from '../validators/common';

const router = Router();

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: List suppliers (paginated, searchable)
 *     tags: [Suppliers]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses: { 200: { description: Paginated suppliers } }
 *   post:
 *     summary: Create a supplier
 *     tags: [Suppliers]
 *     responses: { 201: { description: Created }, 409: { $ref: '#/components/responses/Conflict' } }
 * /suppliers/{id}:
 *   get:
 *     summary: Get a supplier
 *     tags: [Suppliers]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Supplier }, 404: { $ref: '#/components/responses/NotFound' } }
 *   put:
 *     summary: Update a supplier
 *     tags: [Suppliers]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Updated }, 404: { $ref: '#/components/responses/NotFound' } }
 *   delete:
 *     summary: Delete a supplier (guarded if referenced)
 *     tags: [Suppliers]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 204: { description: Deleted }, 409: { $ref: '#/components/responses/Conflict' } }
 */
router.get('/', validate({ query: catalogListQuery }), asyncHandler(supplier.list));
router.post('/', validate({ body: createCatalog }), asyncHandler(supplier.create));
router.get('/:id', validate({ params: idParam }), asyncHandler(supplier.getById));
router.put('/:id', validate({ params: idParam, body: updateCatalog }), asyncHandler(supplier.update));
router.delete('/:id', validate({ params: idParam }), asyncHandler(supplier.remove));

export default router;
