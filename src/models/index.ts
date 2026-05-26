import { DataTypes, Model, type Optional, Sequelize } from 'sequelize';
import { multiplyMoney, moneyDiffers } from '../utils/decimal';
import { computeIsoWeek } from '../utils/isoWeek';
import config from './config';

const env = (process.env.NODE_ENV ?? 'development') as 'development' | 'test' | 'production';
export const sequelize = new Sequelize(config[env]);

// ── Attribute shapes (plain interfaces — no domain entities) ──────────────────
export interface SupplierAttrs {
  id: number;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface LandAttrs extends SupplierAttrs {}
export interface ProductAttrs extends SupplierAttrs {}

export interface TicketAttrs {
  id: number;
  code: string;
  date: string; // DATEONLY → 'YYYY-MM-DD'
  supplierId: number;
  isoYear: number;
  isoWeek: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketItemAttrs {
  id: number;
  ticketId: number;
  productId: number;
  landId: number;
  totalQty: number;
  price: string; // DECIMAL(14,4) → string
  total: string;
  totalCalculated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Instance = Model<...> & Attrs so `instance.code` etc. are typed.
type CatalogCreation<T extends SupplierAttrs> = Optional<T, 'id' | 'createdAt' | 'updatedAt'>;
export type SupplierInstance = Model<SupplierAttrs, CatalogCreation<SupplierAttrs>> & SupplierAttrs;
export type LandInstance = Model<LandAttrs, CatalogCreation<LandAttrs>> & LandAttrs;
export type ProductInstance = Model<ProductAttrs, CatalogCreation<ProductAttrs>> & ProductAttrs;
export type TicketInstance = Model<
  TicketAttrs,
  Optional<TicketAttrs, 'id' | 'isoYear' | 'isoWeek' | 'createdAt' | 'updatedAt'>
> &
  TicketAttrs & { supplier?: SupplierAttrs; items?: TicketItemAttrs[] };
export type TicketItemInstance = Model<
  TicketItemAttrs,
  Optional<TicketItemAttrs, 'id' | 'total' | 'totalCalculated' | 'createdAt' | 'updatedAt'>
> &
  TicketItemAttrs & { product?: ProductAttrs; land?: LandAttrs };

const TIMESTAMPS = {
  createdAt: { type: DataTypes.DATE },
  updatedAt: { type: DataTypes.DATE },
};

const catalogColumns = {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  ...TIMESTAMPS,
};

export const Supplier = sequelize.define<SupplierInstance>('Supplier', catalogColumns, {
  tableName: 'suppliers',
});
export const Land = sequelize.define<LandInstance>('Land', catalogColumns, { tableName: 'lands' });
export const Product = sequelize.define<ProductInstance>('Product', catalogColumns, {
  tableName: 'products',
});

export const Ticket = sequelize.define<TicketInstance>(
  'Ticket',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // VARCHAR — codes are not all numeric (e.g. "GPE01"). Unique index in migration.
    code: { type: DataTypes.STRING(32), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: false },
    isoYear: { type: DataTypes.SMALLINT, allowNull: false },
    isoWeek: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 1, max: 53 } },
    ...TIMESTAMPS,
  },
  {
    tableName: 'tickets',
    hooks: {
      // Keep (iso_year, iso_week) in lock-step with `date` — never set by callers.
      beforeValidate(ticket: TicketInstance): void {
        if (ticket.date && (ticket.isNewRecord || ticket.changed('date'))) {
          const { isoYear, isoWeek } = computeIsoWeek(ticket.date);
          ticket.isoYear = isoYear;
          ticket.isoWeek = isoWeek;
        }
      },
    },
  },
);

export const TicketItem = sequelize.define<TicketItemInstance>(
  'TicketItem',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ticketId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    landId: { type: DataTypes.INTEGER, allowNull: false },
    totalQty: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    price: { type: DataTypes.DECIMAL(14, 4), allowNull: false },
    total: { type: DataTypes.DECIMAL(14, 4), allowNull: false },
    totalCalculated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...TIMESTAMPS,
  },
  {
    tableName: 'ticket_items',
    hooks: {
      // DB-level guarantee: persisted `total` always equals qty × price.
      beforeSave(item: TicketItemInstance): void {
        const expected = multiplyMoney(item.price, item.totalQty);
        if (item.total == null || moneyDiffers(item.total, expected)) {
          item.totalCalculated = true;
        }
        item.total = expected;
      },
    },
  },
);

// ── Associations ──────────────────────────────────────────────────────────────
Supplier.hasMany(Ticket, { foreignKey: 'supplierId', as: 'tickets' });
Ticket.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

Ticket.hasMany(TicketItem, { foreignKey: 'ticketId', as: 'items', onDelete: 'CASCADE', hooks: true });
TicketItem.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

Product.hasMany(TicketItem, { foreignKey: 'productId', as: 'items' });
TicketItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Land.hasMany(TicketItem, { foreignKey: 'landId', as: 'items' });
TicketItem.belongsTo(Land, { foreignKey: 'landId', as: 'land' });
