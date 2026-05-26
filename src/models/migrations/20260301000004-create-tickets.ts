import { DataTypes, type QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('tickets', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // Stored as VARCHAR (not BIGINT): the dataset contains alphanumeric codes
    // such as "GPE01". Uniqueness is enforced by `tickets_code_uk` (see the
    // add-indexes migration), enabling idempotent re-imports.
    code: { type: DataTypes.STRING(32), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'suppliers', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    iso_year: { type: DataTypes.SMALLINT, allowNull: false },
    iso_week: { type: DataTypes.SMALLINT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.sequelize.query(
    'ALTER TABLE "tickets" ADD CONSTRAINT "tickets_iso_week_chk" CHECK ("iso_week" BETWEEN 1 AND 53)',
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('tickets');
}
