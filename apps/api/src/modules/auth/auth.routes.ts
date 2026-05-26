import { Router, type Router as RouterType } from 'express';
import { authLimiter } from '../../middlewares/rateLimit.js';
import { validateBody } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { LoginSchema, RegisterSchema } from '@genograma/shared';
import * as ctrl from './auth.controller.js';

export const authRouter: RouterType = Router();

authRouter.post('/register', authLimiter, validateBody(RegisterSchema), ctrl.register);
authRouter.post('/login', authLimiter, validateBody(LoginSchema), ctrl.login);
authRouter.post('/logout', ctrl.logout);
authRouter.post('/refresh', ctrl.refresh);
authRouter.get('/me', authenticate, ctrl.me);

// Google OAuth - stubs (requiere GOOGLE_CLIENT_ID configurado)
authRouter.get('/google', (_req, res) => {
  res.status(501).json({
    error: { code: 'NOT_CONFIGURED', message: 'Google OAuth no configurado. Ver docs/EMAIL.md y env GOOGLE_CLIENT_ID' },
  });
});
authRouter.get('/google/callback', (_req, res) => {
  res.status(501).json({ error: { code: 'NOT_CONFIGURED', message: 'Pendiente configurar' } });
});
