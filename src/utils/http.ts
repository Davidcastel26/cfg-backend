import type { NextFunction, Request, RequestHandler, Response } from 'express';
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError as SequelizeValidationError,
} from 'sequelize';
import { ZodError, type ZodType } from 'zod';
import { isAppError } from './errors';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Parsed + coerced request input, populated by `validate`. */
      valid?: { body?: unknown; query?: unknown; params?: unknown };
    }
  }
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Forwards async rejections to the error handler. */
export const asyncHandler =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Validates request parts against zod schemas; stashes results on `req.valid`. */
export function validate(schemas: {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}): RequestHandler {
  return (req, _res, next) => {
    try {
      req.valid = {
        params: schemas.params ? schemas.params.parse(req.params) : undefined,
        query: schemas.query ? schemas.query.parse(req.query) : undefined,
        body: schemas.body ? schemas.body.parse(req.body) : undefined,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `Cannot ${req.method} ${req.originalUrl}` },
  });
}

/** Terminal error handler — maps known errors to a stable `{ error }` envelope. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Resource already exists' } });
    return;
  }
  if (err instanceof ForeignKeyConstraintError) {
    res
      .status(409)
      .json({ error: { code: 'CONFLICT', message: 'Operation violates a foreign-key constraint' } });
    return;
  }
  if (err instanceof SequelizeValidationError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.errors.map((e) => ({ path: e.path, message: e.message })),
      },
    });
    return;
  }

  if (isAppError(err)) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
}
