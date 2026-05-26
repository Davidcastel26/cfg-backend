import { Op, type WhereOptions } from 'sequelize';
import { Land, type LandAttrs, type LandInstance } from '../models';
import type { CatalogFilters } from '../utils/pagination';

const searchWhere = (search?: string): WhereOptions<LandAttrs> =>
  search
    ? { [Op.or]: [{ code: { [Op.iLike]: `%${search}%` } }, { name: { [Op.iLike]: `%${search}%` } }] }
    : {};

export const findById = (id: number): Promise<LandInstance | null> => Land.findByPk(id);

export const findByCode = (code: string): Promise<LandInstance | null> =>
  Land.findOne({ where: { code } });

export const findAll = (f: CatalogFilters): Promise<{ rows: LandInstance[]; count: number }> =>
  Land.findAndCountAll({
    where: searchWhere(f.search),
    order: [[f.sortBy ?? 'code', f.sortOrder ?? 'ASC']],
    limit: f.pageSize,
    offset: (f.page - 1) * f.pageSize,
  });

export async function findOrCreate(data: { code: string; name: string }): Promise<LandInstance> {
  const [model] = await Land.findOrCreate({ where: { code: data.code }, defaults: data });
  return model;
}
