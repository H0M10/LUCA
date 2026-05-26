import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { PersonCreateSchema, PersonUpdateSchema } from '@genograma/shared';
import * as svc from './persons.service.js';

export const personsRouter: RouterType = Router();
personsRouter.use(authenticate);

const TreeParam = z.object({ treeId: z.string().uuid() });
const PersonParam = z.object({ id: z.string().uuid() });

personsRouter.post(
  '/:treeId/persons',
  validateParams(TreeParam),
  validateBody(PersonCreateSchema),
  async (req, res, next) => {
    try {
      const p = await svc.createPerson(req.params.treeId!, req.user!.id, req.body);
      res.status(201).json({ data: p });
    } catch (e) {
      next(e);
    }
  },
);

personsRouter.patch(
  '/persons/:id',
  validateParams(PersonParam),
  validateBody(PersonUpdateSchema),
  async (req, res, next) => {
    try {
      const p = await svc.updatePerson(req.params.id!, req.user!.id, req.body);
      res.json({ data: p });
    } catch (e) {
      next(e);
    }
  },
);

personsRouter.delete('/persons/:id', validateParams(PersonParam), async (req, res, next) => {
  try {
    await svc.deletePerson(req.params.id!, req.user!.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
