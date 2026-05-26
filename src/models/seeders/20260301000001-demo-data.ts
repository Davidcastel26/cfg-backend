import { type QueryInterface, QueryTypes } from 'sequelize';
import { computeIsoWeek } from '../../utils/isoWeek';

/**
 * Demo fixtures: a representative catalog slice + a couple of sample tickets
 * (mirroring real rows from the source sheet). Fully idempotent — re-running
 * `db:seed:all` converges to the same state. The full dataset is loaded via the
 * Excel importer, not here.
 */
const SUPPLIERS = [
  { code: 'SUP004', name: 'Vendor Delta Co' },
  { code: 'SUP009', name: 'Vendor Iota Trading' },
];
const LANDS = [
  { code: 'LOC001', name: 'Warehouse A' },
  { code: 'LOC010', name: 'Processing Hub 2' },
];
const PRODUCTS = [
  { code: 'PRD001', name: 'Product Alpha' },
  { code: 'PRD003', name: 'Product Gamma' },
];
const TICKETS = [
  {
    code: '1115651',
    date: '2023-01-07',
    supplier: 'SUP009',
    items: [
      { product: 'PRD003', land: 'LOC010', qty: 1475, price: '0.7000', total: '1032.5000' },
      { product: 'PRD001', land: 'LOC010', qty: 4650, price: '1.2500', total: '5812.5000' },
    ],
  },
  {
    code: '1136265',
    date: '2023-01-18',
    supplier: 'SUP004',
    items: [{ product: 'PRD001', land: 'LOC001', qty: 7375, price: '1.2500', total: '9218.7500' }],
  },
];

async function upsertCatalog(
  queryInterface: QueryInterface,
  table: 'suppliers' | 'lands' | 'products',
  rows: ReadonlyArray<{ code: string; name: string }>,
): Promise<void> {
  for (const row of rows) {
    await queryInterface.sequelize.query(
      `INSERT INTO ${table} (code, name, created_at, updated_at)
       VALUES (:code, :name, NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`,
      { type: QueryTypes.INSERT, replacements: { code: row.code, name: row.name } },
    );
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  await upsertCatalog(queryInterface, 'suppliers', SUPPLIERS);
  await upsertCatalog(queryInterface, 'lands', LANDS);
  await upsertCatalog(queryInterface, 'products', PRODUCTS);

  for (const ticket of TICKETS) {
    const { isoYear, isoWeek } = computeIsoWeek(ticket.date);
    await queryInterface.sequelize.query(
      `INSERT INTO tickets (code, date, supplier_id, iso_year, iso_week, created_at, updated_at)
       SELECT :code, :date, s.id, :isoYear, :isoWeek, NOW(), NOW()
       FROM suppliers s WHERE s.code = :supplier
       ON CONFLICT (code) DO NOTHING`,
      {
        type: QueryTypes.INSERT,
        replacements: {
          code: ticket.code,
          date: ticket.date,
          supplier: ticket.supplier,
          isoYear,
          isoWeek,
        },
      },
    );

    for (const item of ticket.items) {
      await queryInterface.sequelize.query(
        `INSERT INTO ticket_items
           (ticket_id, product_id, land_id, total_qty, price, total, total_calculated, created_at, updated_at)
         SELECT t.id, p.id, l.id, :qty, :price, :total, false, NOW(), NOW()
         FROM tickets t, products p, lands l
         WHERE t.code = :code AND p.code = :product AND l.code = :land
           AND NOT EXISTS (
             SELECT 1 FROM ticket_items ti
             WHERE ti.ticket_id = t.id AND ti.product_id = p.id
               AND ti.land_id = l.id AND ti.total_qty = :qty
           )`,
        {
          type: QueryTypes.INSERT,
          replacements: {
            code: ticket.code,
            product: item.product,
            land: item.land,
            qty: item.qty,
            price: item.price,
            total: item.total,
          },
        },
      );
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const codes = TICKETS.map((t) => t.code);
  // ticket_items cascade on ticket delete.
  await queryInterface.bulkDelete('tickets', { code: codes });
  await queryInterface.bulkDelete('suppliers', { code: SUPPLIERS.map((s) => s.code) });
  await queryInterface.bulkDelete('lands', { code: LANDS.map((l) => l.code) });
  await queryInterface.bulkDelete('products', { code: PRODUCTS.map((p) => p.code) });
}
