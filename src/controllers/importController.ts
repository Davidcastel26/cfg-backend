import type { Request, Response } from 'express';
import * as importService from '../services/importService';
import { validationError } from '../utils/errors';

/**
 * Ingests an uploaded .xlsx. No multipart parser is bundled, so the route mounts
 * `express.raw` and the spreadsheet bytes arrive as `req.body` (a Buffer):
 *   curl --data-binary @tickets-prueba.xlsx \
 *        -H 'Content-Type: application/octet-stream' .../import/excel
 */
export async function importExcel(req: Request, res: Response): Promise<void> {
  const body = req.body as unknown;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    throw validationError(
      'Request body must contain the raw .xlsx bytes (Content-Type: application/octet-stream)',
    );
  }
  const result = await importService.importFromBuffer(body);
  const status = result.skipped > 0 && result.created + result.updated === 0 ? 422 : 200;
  res.status(status).json(result);
}
