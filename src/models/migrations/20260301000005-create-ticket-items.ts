import { DataTypes, type QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('ticket_items', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'tickets', key: 'id' },
      onUpdate: 'CASCADE',
      // Header-led lifecycle: deleting a ticket removes its lines.
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'products', key: 'id' },
      onUpdate: 'CASCADE',
      // Protect catalog integrity.
      onDelete: 'RESTRICT',
    },
    land_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'lands', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    total_qty: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(14, 4), allowNull: false },
    total: { type: DataTypes.DECIMAL(14, 4), allowNull: false },
    total_calculated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.sequelize.query(
    'ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_qty_chk" CHECK ("total_qty" >= 0)',
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('ticket_items');
}
