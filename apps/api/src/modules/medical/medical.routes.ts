import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import {
  AllergyCreateSchema,
  HabitCreateSchema,
  PersonConditionCreateSchema,
} from '@genograma/shared';
import * as svc from './medical.service.js';

export const medicalRouter: RouterType = Router();
medicalRouter.use(authenticate);

const PersonParam = z.object({ personId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

medicalRouter.get('/persons/:personId/medical', validateParams(PersonParam), async (req, res, next) => {
  try {
    const data = await svc.listPersonMedical(req.params.personId!, req.user!.id);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

medicalRouter.post(
  '/persons/:personId/conditions',
  validateParams(PersonParam),
  validateBody(PersonConditionCreateSchema),
  async (req, res, next) => {
    try {
      const c = await svc.addCondition(req.params.personId!, req.user!.id, req.body);
      res.status(201).json({ data: c });
    } catch (e) {
      next(e);
    }
  },
);

medicalRouter.post(
  '/persons/:personId/allergies',
  validateParams(PersonParam),
  validateBody(AllergyCreateSchema),
  async (req, res, next) => {
    try {
      const a = await svc.addAllergy(req.params.personId!, req.user!.id, req.body);
      res.status(201).json({ data: a });
    } catch (e) {
      next(e);
    }
  },
);

medicalRouter.post(
  '/persons/:personId/habits',
  validateParams(PersonParam),
  validateBody(HabitCreateSchema),
  async (req, res, next) => {
    try {
      const h = await svc.addHabit(req.params.personId!, req.user!.id, req.body);
      res.status(201).json({ data: h });
    } catch (e) {
      next(e);
    }
  },
);

medicalRouter.delete('/conditions/:id', validateParams(IdParam), async (req, res, next) => {
  try {
    await svc.deleteCondition(req.params.id!, req.user!.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
medicalRouter.delete('/allergies/:id', validateParams(IdParam), async (req, res, next) => {
  try {
    await svc.deleteAllergy(req.params.id!, req.user!.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
medicalRouter.delete('/habits/:id', validateParams(IdParam), async (req, res, next) => {
  try {
    await svc.deleteHabit(req.params.id!, req.user!.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
