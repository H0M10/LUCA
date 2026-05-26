import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { RelationshipCreateSchema } from '@genograma/shared';
import * as svc from './relationships.service.js';

export const relationshipsRouter: RouterType = Router();
relationshipsRouter.use(authenticate);

const IdParam = z.object({ id: z.string().uuid() });

relationshipsRouter.post('/', validateBody(RelationshipCreateSchema), async (req, res, next) => {
  try {
    const rel = await svc.createRelationship(req.user!.id, req.body);
    res.status(201).json({ data: rel });
  } catch (e) {
    next(e);
  }
});

relationshipsRouter.delete('/:id', validateParams(IdParam), async (req, res, next) => {
  try {
    await svc.deleteRelationship(req.params.id!, req.user!.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
