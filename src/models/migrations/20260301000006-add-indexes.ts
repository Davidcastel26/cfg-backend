import { type QueryInterface } from 'sequelize';

/**
 * Performance & integrity indexes (§2.3). Kept in a dedicated migration so
 * index tuning evolves independently of schema topology.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Idempotent re-imports rely on a unique ticket code.
  await queryInterface.addIndex('tickets', ['code'], {
    name: 'tickets_code_uk',
    unique: true,
  });
  await queryInterface.addIndex('tickets', ['supplier_id'], { name: 'tickets_supplier_idx' });
  await queryInterface.addIndex('tickets', ['date'], { name: 'tickets_date_idx' });
  // Composite index powering the bonus weekly-payment query.
  await queryInterface.addIndex('tickets', ['iso_year', 'iso_week'], {
    name: 'tickets_iso_week_idx',
  });

  await queryInterface.addIndex('ticket_items', ['ticket_id'], {
    name: 'ticket_items_ticket_idx',
  });
  await queryInterface.addIndex('ticket_items', ['product_id'], {
    name: 'ticket_items_product_idx',
  });
  await queryInterface.addIndex('ticket_items', ['land_id'], {
    name: 'ticket_items_land_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex('ticket_items', 'ticket_items_land_idx');
  await queryInterface.removeIndex('ticket_items', 'ticket_items_product_idx');
  await queryInterface.removeIndex('ticket_items', 'ticket_items_ticket_idx');
  await queryInterface.removeIndex('tickets', 'tickets_iso_week_idx');
  await queryInterface.removeIndex('tickets', 'tickets_date_idx');
  await queryInterface.removeIndex('tickets', 'tickets_supplier_idx');
  await queryInterface.removeIndex('tickets', 'tickets_code_uk');
}
