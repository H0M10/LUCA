import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `${req.method} ${req.path}` } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION', message: 'Datos inválidos', details: err.flatten() },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  // body-parser invalid JSON
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(400).json({ error: { code: 'BAD_JSON', message: 'JSON inválido' } });
    return;
  }
  logger.error({ err: serializeErr(err) }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Error interno',
      // En prod mostramos detalles para depurar — quitar cuando esté estable
      ...(env.NODE_ENV !== 'production' || env.DEBUG_ERRORS
        ? { details: serializeErr(err) }
        : { hint: (err as { message?: string })?.message ?? 'desconocido' }),
    },
  });
};

function serializeErr(e: unknown) {
  if (!e) return { message: 'unknown' };
  if (typeof e === 'string') return { message: e };
  const x = e as { name?: string; message?: string; code?: string; meta?: unknown; stack?: string };
  return {
    name: x.name,
    message: x.message,
    code: x.code,
    meta: x.meta,
    stack: x.stack?.split('\n').slice(0, 5).join('\n'),
  };
}
