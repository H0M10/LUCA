import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin, requireStaff } from '../../middlewares/authenticate.js';
import { validateBody } from '../../middlewares/validate.js';
import { Errors } from '../../lib/errors.js';
import { USER_ROLES, USER_STATUSES } from '@genograma/shared';
import { getAdminStats, listAdminUsers, updateAdminUser } from './admin.service.js';

const UpdateUserSchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export const adminRouter: RouterType = Router();
adminRouter.use(authenticate);

// Estadísticas y listado: admin o trabajador
adminRouter.get('/stats', requireStaff, async (_req, res, next) => {
  try {
    res.json({ data: await getAdminStats() });
  } catch {
    next(Errors.internal());
  }
});

adminRouter.get('/users', requireStaff, async (_req, res, next) => {
  try {
    res.json({ data: await listAdminUsers() });
  } catch {
    next(Errors.internal());
  }
});

// Cambiar rol/estatus: solo administrador
adminRouter.patch('/users/:id', requireAdmin, validateBody(UpdateUserSchema), async (req, res, next) => {
  try {
    const updated = await updateAdminUser(req.params.id!, req.user!.id, req.body);
    res.json({ data: updated });
  } catch (e) {
    next(e);
  }
});
