import type { Request, Response } from 'express';
import type { TicketFilters } from '../repositories/ticketRepository';
import * as ticketService from '../services/ticketService';
import type {
  CreateTicketInput,
  ItemInput,
  PatchTicketInput,
} from '../services/ticketService';
import type { ListTicketsQuery } from '../validators/ticket';

export async function list(req: Request, res: Response): Promise<void> {
  const q = req.valid!.query as ListTicketsQuery;
  const filters: TicketFilters = {
    page: q.page,
    pageSize: q.pageSize,
    supplierId: q.supplierId,
    productId: q.productId,
    landId: q.landId,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    code: q.code,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
  };
  res.json(await ticketService.list(filters));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  res.json(await ticketService.getById(id));
}

export async function create(req: Request, res: Response): Promise<void> {
  res.status(201).json(await ticketService.create(req.valid!.body as CreateTicketInput));
}

export async function replace(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  res.json(await ticketService.replace(id, req.valid!.body as CreateTicketInput));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  res.json(await ticketService.updateHeader(id, req.valid!.body as PatchTicketInput));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  await ticketService.remove(id);
  res.status(204).send();
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const { id } = req.valid!.params as { id: number };
  res.status(201).json(await ticketService.addItem(id, req.valid!.body as ItemInput));
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  const { id, itemId } = req.valid!.params as { id: number; itemId: number };
  await ticketService.removeItem(id, itemId);
  res.status(204).send();
}
