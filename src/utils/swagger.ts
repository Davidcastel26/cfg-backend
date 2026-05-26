import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CFG Tickets API',
      version: '1.0.0',
      description: 'Purchase ticket management — Prueba técnica CFG (Service-Repository MVC)',
    },
    servers: [{ url: 'http://localhost:3000/api/v1', description: 'Local' }],
    tags: [
      { name: 'Tickets' },
      { name: 'Suppliers' },
      { name: 'Lands' },
      { name: 'Products' },
      { name: 'Import' },
      { name: 'Payments' },
      { name: 'Health' },
    ],
    components: {
      schemas: {
        CatalogRef: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
          },
        },
        TicketItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            landId: { type: 'integer' },
            product: { $ref: '#/components/schemas/CatalogRef' },
            land: { $ref: '#/components/schemas/CatalogRef' },
            totalQty: { type: 'integer', example: 7375 },
            price: { type: 'string', example: '1.2500' },
            total: { type: 'string', example: '9218.7500' },
            totalCalculated: { type: 'boolean' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string', example: '1136265' },
            date: { type: 'string', format: 'date', example: '2023-01-18' },
            supplierId: { type: 'integer' },
            supplier: { $ref: '#/components/schemas/CatalogRef' },
            isoYear: { type: 'integer', example: 2023 },
            isoWeek: { type: 'integer', example: 3 },
            total: { type: 'string', example: '9218.7500' },
            items: { type: 'array', items: { $ref: '#/components/schemas/TicketItem' } },
          },
        },
        WeeklyPaymentSummary: {
          type: 'object',
          properties: {
            isoYear: { type: 'integer' },
            isoWeek: { type: 'integer' },
            weekStart: { type: 'string', format: 'date' },
            weekEnd: { type: 'string', format: 'date' },
            totals: {
              type: 'object',
              properties: {
                ticketCount: { type: 'integer' },
                itemCount: { type: 'integer' },
                grandTotal: { type: 'string', example: '284512.6500' },
                supplierCount: { type: 'integer' },
              },
            },
            suppliers: { type: 'array', items: { type: 'object' } },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: {},
              },
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'Entity not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Conflict: {
          description: 'Conflicting state',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  apis: [path.join(__dirname, '..', 'routes', '*.{ts,js}')],
};

export function buildOpenApiSpec(): object {
  return swaggerJsdoc(options);
}
