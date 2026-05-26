import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  role: 'user' | 'admin';
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as AccessTokenPayload;
}

export interface RefreshTokenPayload {
  sub: string;
  fid: string; // family id
  jti: string; // unique id of this refresh token
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ['HS256'],
  }) as RefreshTokenPayload;
}
