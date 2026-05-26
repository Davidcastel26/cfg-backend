import { Op, type WhereOptions } from 'sequelize';
import { Supplier, type SupplierAttrs, type SupplierInstance } from '../models';
import type { CatalogFilters } from '../utils/pagination';

const searchWhere = (search?: string): WhereOptions<SupplierAttrs> =>
  search
    ? { [Op.or]: [{ code: { [Op.iLike]: `%${search}%` } }, { name: { [Op.iLike]: `%${search}%` } }] }
    : {};

export const findById = (id: number): Promise<SupplierInstance | null> => Supplier.findByPk(id);

export const findByCode = (code: string): Promise<SupplierInstance | null> =>
  Supplier.findOne({ where: { code } });

export const findAll = (f: CatalogFilters): Promise<{ rows: SupplierInstance[]; count: number }> =>
  Supplier.findAndCountAll({
    where: searchWhere(f.search),
    order: [[f.sortBy ?? 'code', f.sortOrder ?? 'ASC']],
    limit: f.pageSize,
    offset: (f.page - 1) * f.pageSize,
  });

export const create = (data: { code: string; name: string }): Promise<SupplierInstance> =>
  Supplier.create(data);

export async function update(
  id: number,
  data: { code?: string; name?: string },
): Promise<SupplierInstance | null> {
  const model = await Supplier.findByPk(id);
  if (!model) return null;
  return model.update(data);
}

export const remove = (id: number): Promise<number> => Supplier.destroy({ where: { id } });

export async function findOrCreate(data: { code: string; name: string }): Promise<SupplierInstance> {
  const [model] = await Supplier.findOrCreate({ where: { code: data.code }, defaults: data });
  return model;
}
