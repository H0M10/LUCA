import type { RequestHandler } from 'express';
import type { UserRole } from '@genograma/shared';
import { verifyAccessToken } from '../lib/jwt.js';
import { cookieNames } from '../lib/cookies.js';
import { Errors } from '../lib/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[cookieNames.ACCESS];
  if (!token) return next(Errors.unauthorized());
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(Errors.unauthorized('Sesión inválida o expirada'));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(Errors.unauthorized());
  if (req.user.role !== 'admin') return next(Errors.forbidden('Requiere rol admin'));
  next();
};

/** Personal autorizado: administradores y trabajadores. */
export const requireStaff: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(Errors.unauthorized());
  if (req.user.role !== 'admin' && req.user.role !== 'worker') {
    return next(Errors.forbidden('Requiere rol de administrador o trabajador'));
  }
  next();
};
