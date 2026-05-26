import { Router } from 'express';
import * as ticket from '../controllers/ticketController';
import { asyncHandler, validate } from '../utils/http';
import { idParam } from '../validators/common';
import {
  createTicket,
  createTicketItem,
  itemParams,
  listTicketsQuery,
  updateTicket,
} from '../validators/ticket';

const router = Router();

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: List tickets (paginated, filterable)
 *     tags: [Tickets]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: pageSize, schema: { type: integer, default: 20 } }
 *       - { in: query, name: supplierId, schema: { type: integer } }
 *       - { in: query, name: productId, schema: { type: integer } }
 *       - { in: query, name: landId, schema: { type: integer } }
 *       - { in: query, name: dateFrom, schema: { type: string, format: date } }
 *       - { in: query, name: dateTo, schema: { type: string, format: date } }
 *       - { in: query, name: code, schema: { type: string } }
 *     responses: { 200: { description: Paginated tickets } }
 *   post:
 *     summary: Create a ticket with line items
 *     tags: [Tickets]
 *     responses:
 *       201: { description: Created }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/', validate({ query: listTicketsQuery }), asyncHandler(ticket.list));
router.post('/', validate({ body: createTicket }), asyncHandler(ticket.create));

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get a ticket with all items
 *     tags: [Tickets]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Ticket }, 404: { $ref: '#/components/responses/NotFound' } }
 *   put:
 *     summary: Replace a ticket header and items
 *     tags: [Tickets]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Replaced }, 404: { $ref: '#/components/responses/NotFound' } }
 *   patch:
 *     summary: Partial header update
 *     tags: [Tickets]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Updated }, 404: { $ref: '#/components/responses/NotFound' } }
 *   delete:
 *     summary: Delete a ticket (cascades items)
 *     tags: [Tickets]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 204: { description: Deleted }, 404: { $ref: '#/components/responses/NotFound' } }
 */
router.get('/:id', validate({ params: idParam }), asyncHandler(ticket.getById));
router.put('/:id', validate({ params: idParam, body: createTicket }), asyncHandler(ticket.replace));
router.patch('/:id', validate({ params: idParam, body: updateTicket }), asyncHandler(ticket.update));
router.delete('/:id', validate({ params: idParam }), asyncHandler(ticket.remove));

/**
 * @swagger
 * /tickets/{id}/items:
 *   post:
 *     summary: Append a line item
 *     tags: [Tickets]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 201: { description: Appended } }
 * /tickets/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove one line item
 *     tags: [Tickets]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: itemId, required: true, schema: { type: integer } }
 *     responses: { 204: { description: Removed } }
 */
router.post('/:id/items', validate({ params: idParam, body: createTicketItem }), asyncHandler(ticket.addItem));
router.delete('/:id/items/:itemId', validate({ params: itemParams }), asyncHandler(ticket.removeItem));

export default router;
