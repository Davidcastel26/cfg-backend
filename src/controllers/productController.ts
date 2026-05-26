import type { Request, Response } from 'express';
import * as productService from '../services/productService';
import type { CatalogFilters } from '../utils/pagination';
import type { CatalogListQuery } from '../validators/catalog';

export async function list(req: Request, res: Response): Promise<void> {
  const q = req.valid!.query as CatalogListQuery;
  const filters: CatalogFilters = {
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
  };
  res.json(await productService.list(filters));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  res.json(await productService.getById(id));
}
