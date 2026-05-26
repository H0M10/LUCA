import { Router, type Router as RouterType } from 'express';
import { authLimiter } from '../../middlewares/rateLimit.js';
import { validateBody } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { LoginSchema, RegisterSchema } from '@genograma/shared';
import * as ctrl from './auth.controller.js';
import {
  buildAuthUrl,
  exchangeCodeAndVerify,
  getGoogleClient,
  signOAuthState,
  verifyOAuthState,
} from '../../lib/googleOAuth.js';
import { findOrCreateGoogleUser, issueGoogleTokens } from './google.service.js';
import { setAuthCookies } from '../../lib/cookies.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export const authRouter: RouterType = Router();

authRouter.post('/register', authLimiter, validateBody(RegisterSchema), ctrl.register);
authRouter.post('/login', authLimiter, validateBody(LoginSchema), ctrl.login);
authRouter.post('/logout', ctrl.logout);
authRouter.post('/refresh', ctrl.refresh);
authRouter.get('/me', authenticate, ctrl.me);

// ───────── Google OAuth ─────────
const OAUTH_STATE_COOKIE = 'gn_oauth';

// 1) Inicia el flujo: redirige a Google
authRouter.get('/google', (_req, res, next) => {
  try {
    if (!getGoogleClient()) {
      return res.redirect(`${env.FRONTEND_URL}/#/login?error=google_not_configured`);
    }
    const { state, nonce } = signOAuthState();
    res.cookie(OAUTH_STATE_COOKIE, JSON.stringify({ state, nonce }), {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    });
    const url = buildAuthUrl(state, nonce);
    res.redirect(url);
  } catch (e) {
    next(e);
  }
});

// 2) Google nos llama de vuelta con code+state
authRouter.get('/google/callback', async (req, res, next) => {
  try {
    if (!getGoogleClient()) {
      return res.redirect(`${env.FRONTEND_URL}/#/login?error=google_not_configured`);
    }
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) {
      return res.redirect(`${env.FRONTEND_URL}/#/login?error=missing_params`);
    }

    // Validar state contra cookie
    const raw = req.cookies?.[OAUTH_STATE_COOKIE];
    if (!raw) return res.redirect(`${env.FRONTEND_URL}/#/login?error=no_state_cookie`);
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

    let cookiePayload: { state: string; nonce: string };
    try {
      cookiePayload = JSON.parse(raw);
    } catch {
      return res.redirect(`${env.FRONTEND_URL}/#/login?error=bad_cookie`);
    }
    if (cookiePayload.state !== state) {
      return res.redirect(`${env.FRONTEND_URL}/#/login?error=state_mismatch`);
    }
    const { nonce } = verifyOAuthState(state);
    if (nonce !== cookiePayload.nonce) {
      return res.redirect(`${env.FRONTEND_URL}/#/login?error=nonce_mismatch`);
    }

    // Intercambiar code por tokens y verificar id_token
    const payload = await exchangeCodeAndVerify(code, nonce);

    // Encontrar/crear usuario y emitir cookies
    const user = await findOrCreateGoogleUser(payload);
    const tokens = await issueGoogleTokens(
      user.id,
      user.role as 'user' | 'admin',
      { ip: req.ip, ua: req.headers['user-agent'] },
    );
    setAuthCookies(res, tokens.access, tokens.refresh);

    res.redirect(`${env.FRONTEND_URL}/#/dashboard`);
  } catch (e) {
    logger.error({ err: e }, 'Google OAuth callback failed');
    res.redirect(`${env.FRONTEND_URL}/#/login?error=oauth_failed`);
  }
});

// Endpoint informativo para el frontend
authRouter.get('/providers', (_req, res) => {
  res.json({
    data: {
      google: !!getGoogleClient(),
    },
  });
});
