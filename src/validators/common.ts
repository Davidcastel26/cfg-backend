import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const sortOrder = z.enum(['ASC', 'DESC']);

export const moneyInput = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)]);

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
