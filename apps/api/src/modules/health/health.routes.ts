import { Router, type Router as RouterType } from 'express';
import { prisma } from '../../lib/prisma.js';

export const healthRouter: RouterType = Router();

healthRouter.get('/', async (_req, res) => {
  let db: 'up' | 'down' = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'up';
  } catch {
    db = 'down';
  }
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db,
    timestamp: new Date().toISOString(),
  });
});
