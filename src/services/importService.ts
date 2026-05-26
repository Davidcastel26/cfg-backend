import * as XLSX from 'xlsx';
import { sequelize } from '../models';
import * as landRepo from '../repositories/landRepository';
import * as productRepo from '../repositories/productRepository';
import * as supplierRepo from '../repositories/supplierRepository';
import * as ticketRepo from '../repositories/ticketRepository';
import type { ItemRow } from '../repositories/ticketRepository';
import { moneyDiffers, multiplyMoney, roundMoney } from '../utils/decimal';
import { toIsoDateString } from '../utils/isoWeek';

const COLUMNS = {
  ticketCode: 'ticket.code',
  date: 'date',
  supplierCode: 'supplier.code',
  supplierName: 'supplier.name',
  landCode: 'land.code',
  landName: 'land.name',
  productCode: 'product.code',
  productName: 'product.name',
  totalQty: 'total_qty',
  price: 'price',
  total: 'total',
} as const;

interface ParsedRow {
  rowNumber: number;
  ticketCode: string;
  date: string;
  supplier: { code: string; name: string };
  land: { code: string; name: string };
  product: { code: string; name: string };
  totalQty: number;
  price: number;
  total: number | null;
}

export interface ImportResult {
  sheetName: string;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ rowNumber: number; ticketCode?: string; message: string }>;
}

const str = (v: unknown): string => (v == null ? '' : String(v).trim());
const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

function parseRow(raw: Record<string, unknown>, rowNumber: number): ParsedRow {
  const ticketCode = str(raw[COLUMNS.ticketCode]);
  const supplierCode = str(raw[COLUMNS.supplierCode]);
  const landCode = str(raw[COLUMNS.landCode]);
  const productCode = str(raw[COLUMNS.productCode]);
  const totalQty = num(raw[COLUMNS.totalQty]);
  const price = num(raw[COLUMNS.price]);
  const dateCell = raw[COLUMNS.date];

  const missing: string[] = [];
  if (!ticketCode) missing.push(COLUMNS.ticketCode);
  if (!supplierCode) missing.push(COLUMNS.supplierCode);
  if (!landCode) missing.push(COLUMNS.landCode);
  if (!productCode) missing.push(COLUMNS.productCode);
  if (dateCell == null) missing.push(COLUMNS.date);
  if (totalQty == null) missing.push(COLUMNS.totalQty);
  if (price == null) missing.push(COLUMNS.price);
  if (missing.length > 0) throw new Error(`Missing/invalid fields: ${missing.join(', ')}`);

  return {
    rowNumber,
    ticketCode,
    date: toIsoDateString(dateCell as string | number | Date),
    supplier: { code: supplierCode, name: str(raw[COLUMNS.supplierName]) || supplierCode },
    land: { code: landCode, name: str(raw[COLUMNS.landName]) || landCode },
    product: { code: productCode, name: str(raw[COLUMNS.productName]) || productCode },
    totalQty: totalQty as number,
    price: price as number,
    total: num(raw[COLUMNS.total]),
  };
}

function itemRow(row: ParsedRow, productId: number, landId: number): ItemRow {
  const price = roundMoney(row.price);
  const total = multiplyMoney(price, row.totalQty);
  const totalCalculated = row.total == null || moneyDiffers(row.total, total);
  return { productId, landId, totalQty: row.totalQty, price, total, totalCalculated };
}

interface PendingTicket {
  code: string;
  date: string;
  supplierId: number;
  items: ItemRow[];
  rowNumbers: number[];
}

/**
 * Idempotent ingestion: catalog rows via find-or-create, tickets via
 * upsert-by-code (items replaced wholesale, since a line has no natural key).
 * Re-running the same file converges to the same state. Shared by the HTTP
 * route and the CLI/seed.
 */
export async function importWorkbook(workbook: XLSX.WorkBook): Promise<ImportResult> {
  const sheetName = workbook.SheetNames[0] ?? '';
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  const errors: ImportResult['errors'] = [];
  if (!sheet) {
    return { sheetName, totalRows: 0, created: 0, updated: 0, skipped: 0, errors: [{ rowNumber: 0, message: 'No worksheet found' }] };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
  let skipped = 0;

  // Per-run caches: each distinct catalog code hits the DB at most once.
  const supplierCache = new Map<string, number>();
  const landCache = new Map<string, number>();
  const productCache = new Map<string, number>();
  const resolve = async (
    cache: Map<string, number>,
    ref: { code: string; name: string },
    findOrCreate: (d: { code: string; name: string }) => Promise<{ id: number }>,
  ): Promise<number> => {
    const cached = cache.get(ref.code);
    if (cached !== undefined) return cached;
    const { id } = await findOrCreate(ref);
    cache.set(ref.code, id);
    return id;
  };

  const tickets = new Map<string, PendingTicket>();
  for (let i = 0; i < rawRows.length; i += 1) {
    const rowNumber = i + 2; // header is row 1
    try {
      const row = parseRow(rawRows[i] as Record<string, unknown>, rowNumber);
      const supplierId = await resolve(supplierCache, row.supplier, supplierRepo.findOrCreate);
      const landId = await resolve(landCache, row.land, landRepo.findOrCreate);
      const productId = await resolve(productCache, row.product, productRepo.findOrCreate);

      const existing = tickets.get(row.ticketCode);
      if (existing) {
        existing.items.push(itemRow(row, productId, landId));
        existing.rowNumbers.push(rowNumber);
      } else {
        tickets.set(row.ticketCode, {
          code: row.ticketCode,
          date: row.date,
          supplierId,
          items: [itemRow(row, productId, landId)],
          rowNumbers: [rowNumber],
        });
      }
    } catch (err) {
      skipped += 1;
      errors.push({ rowNumber, message: err instanceof Error ? err.message : String(err) });
    }
  }

  let created = 0;
  let updated = 0;
  for (const pending of tickets.values()) {
    try {
      const outcome = await upsertTicket(pending);
      if (outcome === 'created') created += 1;
      else updated += 1;
    } catch (err) {
      skipped += pending.rowNumbers.length;
      errors.push({
        rowNumber: pending.rowNumbers[0] ?? 0,
        ticketCode: pending.code,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { sheetName, totalRows: rawRows.length, created, updated, skipped, errors };
}

async function upsertTicket(pending: PendingTicket): Promise<'created' | 'updated'> {
  return sequelize.transaction(async (t) => {
    const existing = await ticketRepo.findRowByCode(pending.code, t);
    if (existing) {
      existing.date = pending.date;
      existing.supplierId = pending.supplierId;
      await existing.save({ transaction: t });
      await ticketRepo.deleteItems(existing.id, t);
      await ticketRepo.insertItems(existing.id, pending.items, t);
      return 'updated';
    }
    const header = await ticketRepo.insertHeader(
      { code: pending.code, date: pending.date, supplierId: pending.supplierId },
      t,
    );
    await ticketRepo.insertItems(header.id, pending.items, t);
    return 'created';
  });
}

export const importFromBuffer = (buffer: Buffer): Promise<ImportResult> =>
  importWorkbook(XLSX.read(buffer, { type: 'buffer', raw: true }));

export const importFromFile = (filePath: string): Promise<ImportResult> =>
  importWorkbook(XLSX.readFile(filePath, { raw: true }));
