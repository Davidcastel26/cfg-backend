/**
 * Lightweight, functional error helpers. An AppError is just an Error with
 * `status`/`code`/`details` attached — no class hierarchy. The HTTP error
 * handler (utils/http.ts) maps these to responses.
 */
export interface AppError extends Error {
  status: number;
  code: string;
  details?: unknown;
}

function appError(status: number, code: string, message: string, details?: unknown): AppError {
  return Object.assign(new Error(message), { status, code, details });
}

export function isAppError(err: unknown): err is AppError {
  return (
    err instanceof Error &&
    typeof (err as Partial<AppError>).status === 'number' &&
    typeof (err as Partial<AppError>).code === 'string'
  );
}

export const notFoundError = (entity: string, id: string | number): AppError =>
  appError(404, 'ENTITY_NOT_FOUND', `${entity} with identifier "${id}" was not found`, {
    entity,
    id,
  });

export const conflictError = (message: string, details?: unknown): AppError =>
  appError(409, 'CONFLICT', message, details);

export const validationError = (message: string, details?: unknown): AppError =>
  appError(422, 'VALIDATION_ERROR', message, details);
