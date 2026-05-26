import { sequelize } from '../models';
import * as landRepo from '../repositories/landRepository';
import * as productRepo from '../repositories/productRepository';
import * as supplierRepo from '../repositories/supplierRepository';
import * as ticketRepo from '../repositories/ticketRepository';
import type { ItemRow, TicketFilters } from '../repositories/ticketRepository';
import { moneyDiffers, multiplyMoney, roundMoney } from '../utils/decimal';
import { conflictError, notFoundError, validationError } from '../utils/errors';
import { toIsoDateString } from '../utils/isoWeek';
import { paginated, type Paginated } from '../utils/pagination';
import {
  serializeItem,
  serializeTicket,
  type TicketItemResponse,
  type TicketResponse,
} from '../utils/serialize';

export interface ItemInput {
  productId: number;
  landId: number;
  totalQty: number;
  price: number | string;
  total?: number | string | null;
}
export interface CreateTicketInput {
  code: string | number;
  date: string | number;
  supplierId: number;
  items: ItemInput[];
}
export interface PatchTicketInput {
  date?: string | number;
  supplierId?: number;
}

/** Compute the authoritative line-item row: total is always qty × price. */
function toItemRow(i: ItemInput): ItemRow {
  const price = roundMoney(i.price);
  const total = multiplyMoney(price, i.totalQty);
  const totalCalculated = i.total == null || moneyDiffers(i.total, total);
  return { productId: i.productId, landId: i.landId, totalQty: i.totalQty, price, total, totalCalculated };
}

async function assertReferences(supplierId: number, items: ItemInput[]): Promise<void> {
  if (items.length === 0) throw validationError('A ticket must contain at least one line item');
  if (!(await supplierRepo.findById(supplierId))) throw notFoundError('Supplier', supplierId);
  for (const i of items) {
    if (!(await productRepo.findById(i.productId))) throw notFoundError('Product', i.productId);
    if (!(await landRepo.findById(i.landId))) throw notFoundError('Land', i.landId);
  }
}

async function loadOrThrow(id: number): Promise<TicketResponse> {
  const model = await ticketRepo.findById(id);
  if (!model) throw notFoundError('Ticket', id);
  return serializeTicket(model);
}

export async function list(filters: TicketFilters): Promise<Paginated<TicketResponse>> {
  const { rows, count } = await ticketRepo.findAll(filters);
  return paginated(rows.map(serializeTicket), filters.page, filters.pageSize, count);
}

export async function getById(id: number): Promise<TicketResponse> {
  return loadOrThrow(id);
}

export async function create(input: CreateTicketInput): Promise<TicketResponse> {
  const code = String(input.code).trim();
  if (await ticketRepo.findRowByCode(code)) {
    throw conflictError(`Ticket with code "${code}" already exists`);
  }
  await assertReferences(input.supplierId, input.items);
  const date = toIsoDateString(input.date);

  const id = await sequelize.transaction(async (t) => {
    const header = await ticketRepo.insertHeader({ code, date, supplierId: input.supplierId }, t);
    await ticketRepo.insertItems(header.id, input.items.map(toItemRow), t);
    return header.id;
  });
  return loadOrThrow(id);
}

export async function replace(id: number, input: CreateTicketInput): Promise<TicketResponse> {
  if (!(await ticketRepo.findRow(id))) throw notFoundError('Ticket', id);
  const code = String(input.code).trim();
  const owner = await ticketRepo.findRowByCode(code);
  if (owner && owner.id !== id) throw conflictError(`Ticket with code "${code}" already exists`);
  await assertReferences(input.supplierId, input.items);
  const date = toIsoDateString(input.date);

  await sequelize.transaction(async (t) => {
    const row = await ticketRepo.findRow(id, t);
    if (!row) throw notFoundError('Ticket', id);
    row.code = code;
    row.date = date;
    row.supplierId = input.supplierId;
    await row.save({ transaction: t });
    await ticketRepo.deleteItems(id, t);
    await ticketRepo.insertItems(id, input.items.map(toItemRow), t);
  });
  return loadOrThrow(id);
}

export async function updateHeader(id: number, patch: PatchTicketInput): Promise<TicketResponse> {
  const row = await ticketRepo.findRow(id);
  if (!row) throw notFoundError('Ticket', id);
  if (patch.supplierId !== undefined) {
    if (!(await supplierRepo.findById(patch.supplierId))) {
      throw notFoundError('Supplier', patch.supplierId);
    }
    row.supplierId = patch.supplierId;
  }
  if (patch.date !== undefined) {
    row.date = toIsoDateString(patch.date); // beforeValidate hook re-derives iso week
  }
  await row.save();
  return loadOrThrow(id);
}

export async function remove(id: number): Promise<void> {
  if ((await ticketRepo.remove(id)) === 0) throw notFoundError('Ticket', id);
}

export async function addItem(ticketId: number, input: ItemInput): Promise<TicketItemResponse> {
  if (!(await ticketRepo.findRow(ticketId))) throw notFoundError('Ticket', ticketId);
  if (!(await productRepo.findById(input.productId))) throw notFoundError('Product', input.productId);
  if (!(await landRepo.findById(input.landId))) throw notFoundError('Land', input.landId);
  const created = await ticketRepo.insertItem(ticketId, toItemRow(input));
  if (!created) throw notFoundError('Ticket', ticketId);
  return serializeItem(created.get({ plain: true }));
}

export async function removeItem(ticketId: number, itemId: number): Promise<void> {
  if ((await ticketRepo.removeItem(ticketId, itemId)) === 0) {
    throw notFoundError('TicketItem', itemId);
  }
}
