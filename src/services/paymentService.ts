import * as ticketRepo from '../repositories/ticketRepository';
import type { LandAttrs, ProductAttrs, SupplierAttrs, TicketAttrs, TicketItemAttrs } from '../models';
import { roundMoney, sumMoney } from '../utils/decimal';
import { isoWeekBounds } from '../utils/isoWeek';

export interface WeekRange {
  fromYear?: number;
  fromWeek?: number;
  toYear?: number;
  toWeek?: number;
}

interface WeeklyItem {
  id: number;
  product: { code: string; name: string };
  land: { code: string; name: string };
  totalQty: number;
  price: string;
  total: string;
}
interface WeeklyTicket {
  id: number;
  code: string;
  date: string;
  total: string;
  items: WeeklyItem[];
}
interface WeeklySupplier {
  supplier: { id: number; code: string; name: string };
  subtotal: string;
  ticketCount: number;
  itemCount: number;
  tickets: WeeklyTicket[];
}
export interface WeeklySummary {
  isoYear: number;
  isoWeek: number;
  weekStart: string;
  weekEnd: string;
  totals: { ticketCount: number; itemCount: number; grandTotal: string; supplierCount: number };
  suppliers: WeeklySupplier[];
}

type PlainItem = TicketItemAttrs & { product?: ProductAttrs; land?: LandAttrs };
type PlainTicket = TicketAttrs & { supplier?: SupplierAttrs; items?: PlainItem[] };

export async function weeklySummary(params: {
  isoYear: number;
  isoWeek: number;
  supplierId?: number;
}): Promise<WeeklySummary> {
  const all = (await ticketRepo.findByIsoWeek(params.isoYear, params.isoWeek)).map(
    (t) => t.get({ plain: true }) as PlainTicket,
  );
  const tickets =
    params.supplierId !== undefined ? all.filter((t) => t.supplierId === params.supplierId) : all;

  const groups = new Map<number, WeeklySupplier>();
  for (const t of tickets) {
    const items: WeeklyItem[] = (t.items ?? []).map((i) => ({
      id: i.id,
      product: { code: i.product?.code ?? '', name: i.product?.name ?? '' },
      land: { code: i.land?.code ?? '', name: i.land?.name ?? '' },
      totalQty: i.totalQty,
      price: roundMoney(i.price),
      total: roundMoney(i.total),
    }));
    const ticketTotal = sumMoney(items.map((i) => i.total));
    const weeklyTicket: WeeklyTicket = { id: t.id, code: t.code, date: t.date, total: ticketTotal, items };

    const group = groups.get(t.supplierId);
    if (group) {
      group.tickets.push(weeklyTicket);
      group.ticketCount += 1;
      group.itemCount += items.length;
      group.subtotal = sumMoney([group.subtotal, ticketTotal]);
    } else {
      groups.set(t.supplierId, {
        supplier: { id: t.supplier?.id ?? t.supplierId, code: t.supplier?.code ?? '', name: t.supplier?.name ?? '' },
        subtotal: ticketTotal,
        ticketCount: 1,
        itemCount: items.length,
        tickets: [weeklyTicket],
      });
    }
  }

  const suppliers = [...groups.values()].sort((a, b) => a.supplier.code.localeCompare(b.supplier.code));
  const bounds = isoWeekBounds(params.isoYear, params.isoWeek);
  return {
    isoYear: params.isoYear,
    isoWeek: params.isoWeek,
    weekStart: bounds.weekStart,
    weekEnd: bounds.weekEnd,
    totals: {
      ticketCount: tickets.length,
      itemCount: suppliers.reduce((n, s) => n + s.itemCount, 0),
      grandTotal: sumMoney(suppliers.map((s) => s.subtotal)),
      supplierCount: suppliers.length,
    },
    suppliers,
  };
}

export async function listWeeks(range?: WeekRange): Promise<
  Array<{ isoYear: number; isoWeek: number; ticketCount: number; weekStart: string; weekEnd: string }>
> {
  const weeks = await ticketRepo.listWeeks();
  const lower =
    range?.fromYear !== undefined ? range.fromYear * 100 + (range.fromWeek ?? 1) : -Infinity;
  const upper = range?.toYear !== undefined ? range.toYear * 100 + (range.toWeek ?? 53) : Infinity;
  return weeks
    .filter((w) => {
      const key = w.isoYear * 100 + w.isoWeek;
      return key >= lower && key <= upper;
    })
    .map((w) => {
      const bounds = isoWeekBounds(w.isoYear, w.isoWeek);
      return { ...w, weekStart: bounds.weekStart, weekEnd: bounds.weekEnd };
    });
}
