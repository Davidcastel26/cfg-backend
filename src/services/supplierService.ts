import * as repo from '../repositories/supplierRepository';
import { notFoundError } from '../utils/errors';
import { paginated, type CatalogFilters, type Paginated } from '../utils/pagination';
import { serializeCatalog, type CatalogResponse } from '../utils/serialize';

export async function list(f: CatalogFilters): Promise<Paginated<CatalogResponse>> {
  const { rows, count } = await repo.findAll(f);
  return paginated(rows.map(serializeCatalog), f.page, f.pageSize, count);
}

export async function getById(id: number): Promise<CatalogResponse> {
  const model = await repo.findById(id);
  if (!model) throw notFoundError('Supplier', id);
  return serializeCatalog(model);
}

export async function create(data: { code: string; name: string }): Promise<CatalogResponse> {
  return serializeCatalog(await repo.create(data));
}

export async function update(
  id: number,
  data: { code?: string; name?: string },
): Promise<CatalogResponse> {
  const model = await repo.update(id, data);
  if (!model) throw notFoundError('Supplier', id);
  return serializeCatalog(model);
}

export async function remove(id: number): Promise<void> {
  // FK references → Sequelize ForeignKeyConstraintError → 409 (errorHandler).
  if ((await repo.remove(id)) === 0) throw notFoundError('Supplier', id);
}
