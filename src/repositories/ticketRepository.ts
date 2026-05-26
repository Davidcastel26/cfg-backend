import {
  col,
  fn,
  Op,
  type Includeable,
  type Transaction,
  type WhereOptions,
} from 'sequelize';
import {
  Land,
  Product,
  Supplier,
  Ticket,
  TicketItem,
  type TicketAttrs,
  type TicketInstance,
  type TicketItemInstance,
} from '../models';
import type { PageParams, SortOrder } from '../utils/pagination';

export interface TicketFilters extends PageParams {
  supplierId?: number;
  productId?: number;
  landId?: number;
  dateFrom?: string;
  dateTo?: string;
  code?: string;
  sortBy?: 'date' | 'code' | 'createdAt';
  sortOrder?: SortOrder;
}

export interface ItemRow {
  productId: number;
  landId: number;
  totalQty: number;
  price: string;
  total: string;
  totalCalculated: boolean;
}

export interface WeekAvailability {
  isoYear: number;
  isoWeek: number;
  ticketCount: number;
}

const FULL_INCLUDE: Includeable[] = [
  { model: Supplier, as: 'supplier' },
  {
    model: TicketItem,
    as: 'items',
    include: [
      { model: Product, as: 'product' },
      { model: Land, as: 'land' },
    ],
  },
];

export const findById = (id: number): Promise<TicketInstance | null> =>
  Ticket.findByPk(id, { include: FULL_INCLUDE });

export const findRow = (id: number, transaction?: Transaction): Promise<TicketInstance | null> =>
  Ticket.findByPk(id, { transaction });

export const findByCode = (
  code: string,
  transaction?: Transaction,
): Promise<TicketInstance | null> =>
  Ticket.findOne({ where: { code }, include: FULL_INCLUDE, transaction });

export const findRowByCode = (
  code: string,
  transaction?: Transaction,
): Promise<TicketInstance | null> => Ticket.findOne({ where: { code }, transaction });

export async function findAll(
  f: TicketFilters,
): Promise<{ rows: TicketInstance[]; count: number }> {
  const where: WhereOptions<TicketAttrs> = {};
  if (f.supplierId !== undefined) where.supplierId = f.supplierId;
  if (f.code !== undefined) where.code = { [Op.iLike]: `%${f.code}%` };
  if (f.dateFrom !== undefined || f.dateTo !== undefined) {
    where.date = {
      ...(f.dateFrom !== undefined ? { [Op.gte]: f.dateFrom } : {}),
      ...(f.dateTo !== undefined ? { [Op.lte]: f.dateTo } : {}),
    };
  }

  // Product/land live on line items — resolve matching ticket ids first so the
  // returned tickets still carry their full item set.
  if (f.productId !== undefined || f.landId !== undefined) {
    const itemWhere: Record<string, number> = {};
    if (f.productId !== undefined) itemWhere.productId = f.productId;
    if (f.landId !== undefined) itemWhere.landId = f.landId;
    const matches = await TicketItem.findAll({
      attributes: ['ticketId'],
      where: itemWhere,
      group: ['ticketId'],
    });
    where.id = { [Op.in]: matches.map((m) => m.ticketId) };
  }

  return Ticket.findAndCountAll({
    where,
    include: FULL_INCLUDE,
    order: [[f.sortBy ?? 'date', f.sortOrder ?? 'DESC']],
    limit: f.pageSize,
    offset: (f.page - 1) * f.pageSize,
    distinct: true,
  });
}

export const insertHeader = (
  data: { code: string; date: string; supplierId: number },
  transaction: Transaction,
): Promise<TicketInstance> => Ticket.create(data, { transaction });

export const insertItems = (
  ticketId: number,
  items: ItemRow[],
  transaction: Transaction,
): Promise<TicketItemInstance[]> =>
  TicketItem.bulkCreate(
    items.map((i) => ({ ...i, ticketId })),
    { transaction, validate: true },
  );

export const deleteItems = (ticketId: number, transaction: Transaction): Promise<number> =>
  TicketItem.destroy({ where: { ticketId }, transaction });

export const remove = (id: number): Promise<number> => Ticket.destroy({ where: { id } });

export async function insertItem(ticketId: number, item: ItemRow): Promise<TicketItemInstance | null> {
  const created = await TicketItem.create({ ...item, ticketId });
  return TicketItem.findByPk(created.id, {
    include: [
      { model: Product, as: 'product' },
      { model: Land, as: 'land' },
    ],
  });
}

export const removeItem = (ticketId: number, itemId: number): Promise<number> =>
  TicketItem.destroy({ where: { id: itemId, ticketId } });

export const findByIsoWeek = (isoYear: number, isoWeek: number): Promise<TicketInstance[]> =>
  Ticket.findAll({
    where: { isoYear, isoWeek },
    include: FULL_INCLUDE,
    order: [
      ['supplierId', 'ASC'],
      ['date', 'ASC'],
    ],
  });

export async function listWeeks(): Promise<WeekAvailability[]> {
  const rows = (await Ticket.findAll({
    attributes: ['isoYear', 'isoWeek', [fn('COUNT', col('id')), 'ticketCount']],
    group: ['iso_year', 'iso_week'],
    order: [
      ['isoYear', 'ASC'],
      ['isoWeek', 'ASC'],
    ],
    raw: true,
  })) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    isoYear: Number(r['isoYear']),
    isoWeek: Number(r['isoWeek']),
    ticketCount: Number(r['ticketCount']),
  }));
}
