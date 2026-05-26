import { Op, type WhereOptions } from 'sequelize';
import { Product, type ProductAttrs, type ProductInstance } from '../models';
import type { CatalogFilters } from '../utils/pagination';

const searchWhere = (search?: string): WhereOptions<ProductAttrs> =>
  search
    ? { [Op.or]: [{ code: { [Op.iLike]: `%${search}%` } }, { name: { [Op.iLike]: `%${search}%` } }] }
    : {};

export const findById = (id: number): Promise<ProductInstance | null> => Product.findByPk(id);

export const findByCode = (code: string): Promise<ProductInstance | null> =>
  Product.findOne({ where: { code } });

export const findAll = (f: CatalogFilters): Promise<{ rows: ProductInstance[]; count: number }> =>
  Product.findAndCountAll({
    where: searchWhere(f.search),
    order: [[f.sortBy ?? 'code', f.sortOrder ?? 'ASC']],
    limit: f.pageSize,
    offset: (f.page - 1) * f.pageSize,
  });

export async function findOrCreate(data: { code: string; name: string }): Promise<ProductInstance> {
  const [model] = await Product.findOrCreate({ where: { code: data.code }, defaults: data });
  return model;
}
