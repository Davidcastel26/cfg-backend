import { z } from 'zod';
import { paginationQuery, sortOrder } from './common';

export const catalogListQuery = paginationQuery.extend({
  search: z.string().optional(),
  sortBy: z.enum(['code', 'name', 'createdAt']).optional(),
  sortOrder: sortOrder.optional(),
});

export const createCatalog = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(255),
});

export const updateCatalog = z
  .object({
    code: z.string().trim().min(1).max(32).optional(),
    name: z.string().trim().min(1).max(255).optional(),
  })
  .refine((d) => d.code !== undefined || d.name !== undefined, {
    message: 'At least one of "code" or "name" must be provided',
  });

export type CatalogListQuery = z.infer<typeof catalogListQuery>;
export type CreateCatalogBody = z.infer<typeof createCatalog>;
export type UpdateCatalogBody = z.infer<typeof updateCatalog>;
