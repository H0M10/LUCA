import type { RequestHandler } from 'express';
import { setAuthCookies, clearAuthCookies, cookieNames } from '../../lib/cookies.js';
import * as svc from './auth.service.js';

const meta = (req: Parameters<RequestHandler>[0]) => ({
  ip: req.ip,
  ua: req.headers['user-agent'],
});

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { user, tokens } = await svc.registerUser(req.body, meta(req));
    setAuthCookies(res, tokens.access, tokens.refresh);
    res.status(201).json({ data: user });
  } catch (e) {
    next(e);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { user, tokens } = await svc.loginUser(req.body, meta(req));
    setAuthCookies(res, tokens.access, tokens.refresh);
    res.json({ data: user });
  } catch (e) {
    next(e);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await svc.logoutUser(req.cookies?.[cookieNames.REFRESH]);
    clearAuthCookies(res);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const raw = req.cookies?.[cookieNames.REFRESH];
    if (!raw) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh' } });
    const tokens = await svc.rotateTokens(raw, meta(req));
    setAuthCookies(res, tokens.access, tokens.refresh);
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await svc.getMe(req.user!.id);
    res.json({ data: user });
  } catch (e) {
    next(e);
  }
};
