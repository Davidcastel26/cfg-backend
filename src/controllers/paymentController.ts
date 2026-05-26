import type { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import type { WeekRange } from '../services/paymentService';
import type { WeeklyQuery, WeeklySupplierParams, WeeksRangeQuery } from '../validators/payment';

function parseToken(token: string | undefined): { year?: number; week?: number } {
  if (!token) return {};
  const [y, w] = token.split('-');
  return { year: Number(y), week: Number(w) };
}

export async function weekly(req: Request, res: Response): Promise<void> {
  const q = req.valid!.query as WeeklyQuery;
  res.json(await paymentService.weeklySummary({ isoYear: q.isoYear, isoWeek: q.isoWeek }));
}

export async function weeklySupplier(req: Request, res: Response): Promise<void> {
  const p = req.valid!.params as WeeklySupplierParams;
  res.json(
    await paymentService.weeklySummary({
      isoYear: p.isoYear,
      isoWeek: p.isoWeek,
      supplierId: p.supplierId,
    }),
  );
}

export async function weeks(req: Request, res: Response): Promise<void> {
  const q = req.valid!.query as WeeksRangeQuery;
  const from = parseToken(q.from);
  const to = parseToken(q.to);
  const range: WeekRange = {
    fromYear: from.year,
    fromWeek: from.week,
    toYear: to.year,
    toWeek: to.week,
  };
  res.json(await paymentService.listWeeks(range));
}
