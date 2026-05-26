import rateLimit from 'express-rate-limit';

/** Estricto para login/register/forgot-password — protege fuerza bruta */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Demasiados intentos, espera un momento' } },
});

/**
 * General — más permisivo para navegación normal de SPAs.
 * 600/min permite a un usuario hacer hasta 10 req/seg de pico.
 * Saltamos /health para que el monitor de Render no consuma cuota.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/favicon.ico',
});
