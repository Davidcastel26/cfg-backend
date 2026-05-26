import path from 'node:path';
import { sequelize } from './models';
import { importFromFile } from './services/importService';
import { logger } from './utils/logger';

/** CLI: `npm run import:excel -- <path>`. Same service as POST /import/excel. */
async function main(): Promise<void> {
  const fileArg = process.argv[2];
  if (!fileArg) {
    // eslint-disable-next-line no-console
    console.error('Usage: npm run import:excel -- <path-to-xlsx>');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  try {
    await sequelize.authenticate();
    const result = await importFromFile(filePath);
    logger.info(
      { created: result.created, updated: result.updated, skipped: result.skipped },
      'Import complete',
    );
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    logger.error({ err }, 'Import failed');
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

void main();
