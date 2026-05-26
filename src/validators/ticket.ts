import { z } from 'zod';
import { isoDate, moneyInput, paginationQuery, sortOrder } from './common';

export const createTicketItem = z.object({
  productId: z.coerce.number().int().positive(),
  landId: z.coerce.number().int().positive(),
  totalQty: z.coerce.number().int().min(0),
  price: moneyInput,
  total: moneyInput.nullish(),
});

export const createTicket = z.object({
  code: z.union([z.string().min(1).max(32), z.number()]),
  date: z.union([isoDate, z.number()]),
  supplierId: z.coerce.number().int().positive(),
  items: z.array(createTicketItem).min(1),
});

export const updateTicket = z
  .object({
    date: z.union([isoDate, z.number()]).optional(),
    supplierId: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => d.date !== undefined || d.supplierId !== undefined, {
    message: 'At least one of "date" or "supplierId" must be provided',
  });

export const listTicketsQuery = paginationQuery.extend({
  supplierId: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive().optional(),
  landId: z.coerce.number().int().positive().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  code: z.string().optional(),
  sortBy: z.enum(['date', 'code', 'createdAt']).optional(),
  sortOrder: sortOrder.optional(),
});

export const itemParams = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

export type CreateTicketBody = z.infer<typeof createTicket>;
export type UpdateTicketBody = z.infer<typeof updateTicket>;
export type CreateTicketItemBody = z.infer<typeof createTicketItem>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuery>;
