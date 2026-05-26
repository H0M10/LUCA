import { Router, type Router as RouterType } from 'express';
import { prisma } from '../../lib/prisma.js';

export const catalogRouter: RouterType = Router();

catalogRouter.get('/conditions', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const conditions = await prisma.medical_condition.findMany({
      where: {
        is_active: true,
        ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { code: { contains: q.toUpperCase() } }] } : {}),
      },
      orderBy: { name: 'asc' },
      take: 50,
    });
    res.json({
      data: conditions.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        category: c.category,
        isHereditary: c.is_hereditary,
      })),
    });
  } catch (e) {
    next(e);
  }
});
