export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  unauthorized: (msg = 'No autenticado') => new AppError('UNAUTHORIZED', 401, msg),
  forbidden: (msg = 'No autorizado') => new AppError('FORBIDDEN', 403, msg),
  notFound: (msg = 'Recurso no encontrado') => new AppError('NOT_FOUND', 404, msg),
  conflict: (msg: string) => new AppError('CONFLICT', 409, msg),
  badRequest: (msg: string, details?: unknown) => new AppError('BAD_REQUEST', 400, msg, details),
  rateLimited: (msg = 'Demasiadas solicitudes') => new AppError('RATE_LIMITED', 429, msg),
  internal: (msg = 'Error interno') => new AppError('INTERNAL', 500, msg),
};
