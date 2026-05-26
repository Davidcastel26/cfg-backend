import type { Request, Response } from 'express';
import * as supplierService from '../services/supplierService';
import type { CatalogFilters } from '../utils/pagination';
import type { CatalogListQuery, CreateCatalogBody, UpdateCatalogBody } from '../validators/catalog';

function toFilters(q: CatalogListQuery): CatalogFilters {
  return { page: q.page, pageSize: q.pageSize, search: q.search, sortBy: q.sortBy, sortOrder: q.sortOrder };
}

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await supplierService.list(toFilters(req.valid!.query as CatalogListQuery)));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  res.json(await supplierService.getById(id));
}

export async function create(req: Request, res: Response): Promise<void> {
  res.status(201).json(await supplierService.create(req.valid!.body as CreateCatalogBody));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  res.json(await supplierService.update(id, req.valid!.body as UpdateCatalogBody));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  await supplierService.remove(id);
  res.status(204).send();
}
