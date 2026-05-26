import * as repo from '../repositories/landRepository';
import { notFoundError } from '../utils/errors';
import { paginated, type CatalogFilters, type Paginated } from '../utils/pagination';
import { serializeCatalog, type CatalogResponse } from '../utils/serialize';

export async function list(f: CatalogFilters): Promise<Paginated<CatalogResponse>> {
  const { rows, count } = await repo.findAll(f);
  return paginated(rows.map(serializeCatalog), f.page, f.pageSize, count);
}

export async function getById(id: number): Promise<CatalogResponse> {
  const model = await repo.findById(id);
  if (!model) throw notFoundError('Land', id);
  return serializeCatalog(model);
}
