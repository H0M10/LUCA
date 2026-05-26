import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody } from '../../middlewares/validate.js';
import { UpdateProfileSchema } from '@genograma/shared';
import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';

export const usersRouter: RouterType = Router();
usersRouter.use(authenticate);

usersRouter.patch('/me', validateBody(UpdateProfileSchema), async (req, res, next) => {
  try {
    const user = await prisma.app_user.update({
      where: { id: req.user!.id },
      data: {
        ...(req.body.fullName ? { full_name: req.body.fullName } : {}),
        ...(req.body.birthDate ? { birth_date: req.body.birthDate } : {}),
        ...(req.body.gender ? { gender: req.body.gender } : {}),
        ...(req.body.locale ? { locale: req.body.locale } : {}),
      },
    });
    res.json({
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarMediaId: user.avatar_media_id,
        birthDate: user.birth_date?.toISOString().slice(0, 10) ?? null,
        gender: user.gender,
        role: user.role,
        status: user.status,
        emailVerifiedAt: user.email_verified_at?.toISOString() ?? null,
        locale: user.locale,
      },
    });
  } catch {
    next(Errors.internal());
  }
});
