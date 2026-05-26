import { z } from 'zod';

const isoYear = z.coerce.number().int().min(1970).max(9999);
const isoWeek = z.coerce.number().int().min(1).max(53);

export const weeklyQuery = z.object({ isoYear, isoWeek });

export const weeklySupplierParams = z.object({
  isoYear,
  isoWeek,
  supplierId: z.coerce.number().int().positive(),
});

export const weeksRangeQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{1,2}$/, 'Expected YYYY-WW').optional(),
  to: z.string().regex(/^\d{4}-\d{1,2}$/, 'Expected YYYY-WW').optional(),
});

export type WeeklyQuery = z.infer<typeof weeklyQuery>;
export type WeeklySupplierParams = z.infer<typeof weeklySupplierParams>;
export type WeeksRangeQuery = z.infer<typeof weeksRangeQuery>;
