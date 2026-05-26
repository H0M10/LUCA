import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { TreeCreateSchema, TreeUpdateSchema } from '@genograma/shared';
import * as svc from './trees.service.js';

export const treesRouter: RouterType = Router();
treesRouter.use(authenticate);

const IdParam = z.object({ id: z.string().uuid() });

treesRouter.get('/', async (req, res, next) => {
  try {
    const list = await svc.listMyTrees(req.user!.id);
    res.json({ data: list });
  } catch (e) {
    next(e);
  }
});

treesRouter.post('/', validateBody(TreeCreateSchema), async (req, res, next) => {
  try {
    const tree = await svc.createTree(req.user!.id, req.body);
    res.status(201).json({ data: tree });
  } catch (e) {
    next(e);
  }
});

treesRouter.get('/:id', validateParams(IdParam), async (req, res, next) => {
  try {
    const tree = await svc.getTree(req.params.id!, req.user!.id);
    res.json({ data: tree });
  } catch (e) {
    next(e);
  }
});

treesRouter.patch(
  '/:id',
  validateParams(IdParam),
  validateBody(TreeUpdateSchema),
  async (req, res, next) => {
    try {
      await svc.updateTree(req.params.id!, req.user!.id, req.body);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);

treesRouter.delete('/:id', validateParams(IdParam), async (req, res, next) => {
  try {
    await svc.deleteTree(req.params.id!, req.user!.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
