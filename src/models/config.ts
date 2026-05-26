// Loaded by sequelize-cli (via .sequelizerc) AND by models/index.ts to build the
// live connection. dotenv is loaded here so the CLI sees the same DB_* values.
import 'dotenv/config';
import type { Options } from 'sequelize';

const base: Options = {
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'cfg_tickets_db',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  dialect: 'postgres',
  logging: false,
  define: { underscored: true, timestamps: true },
  pool: { max: 10, min: 0, acquire: 30_000, idle: 10_000 },
};

const config: Record<'development' | 'test' | 'production', Options> = {
  development: { ...base },
  test: { ...base, database: process.env.DB_NAME ?? 'cfg_tickets_test' },
  production: { ...base },
};

export = config;
