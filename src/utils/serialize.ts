import type {
  LandAttrs,
  ProductAttrs,
  SupplierAttrs,
  SupplierInstance,
  TicketAttrs,
  TicketInstance,
  TicketItemAttrs,
} from '../models';
import { roundMoney, sumMoney } from './decimal';

export interface CatalogResponse {
  id: number;
  code: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CatalogRef {
  id: number;
  code: string;
  name: string;
}

export interface TicketItemResponse {
  id: number;
  productId: number;
  landId: number;
  product: CatalogRef | null;
  land: CatalogRef | null;
  totalQty: number;
  price: string;
  total: string;
  totalCalculated: boolean;
}

export interface TicketResponse {
  id: number;
  code: string;
  date: string;
  supplierId: number;
  supplier: CatalogRef | null;
  isoYear: number;
  isoWeek: number;
  total: string;
  items: TicketItemResponse[];
}

type PlainItem = TicketItemAttrs & { product?: ProductAttrs; land?: LandAttrs };
type PlainTicket = TicketAttrs & { supplier?: SupplierAttrs; items?: PlainItem[] };

const toIso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);
const ref = (e: { id: number; code: string; name: string } | undefined | null): CatalogRef | null =>
  e ? { id: e.id, code: e.code, name: e.name } : null;

export function serializeCatalog(model: SupplierInstance | { get(opts: { plain: true }): SupplierAttrs }): CatalogResponse {
  const p = model.get({ plain: true });
  return { id: p.id, code: p.code, name: p.name, createdAt: toIso(p.createdAt), updatedAt: toIso(p.updatedAt) };
}

export function serializeItem(item: PlainItem): TicketItemResponse {
  return {
    id: item.id,
    productId: item.productId,
    landId: item.landId,
    product: ref(item.product),
    land: ref(item.land),
    totalQty: item.totalQty,
    price: roundMoney(item.price),
    total: roundMoney(item.total),
    totalCalculated: item.totalCalculated,
  };
}

export function serializeTicket(model: TicketInstance): TicketResponse {
  const p = model.get({ plain: true }) as PlainTicket;
  const items = (p.items ?? []).map(serializeItem);
  return {
    id: p.id,
    code: p.code,
    date: p.date,
    supplierId: p.supplierId,
    supplier: ref(p.supplier),
    isoYear: p.isoYear,
    isoWeek: p.isoWeek,
    total: sumMoney(items.map((i) => i.total)),
    items,
  };
}
