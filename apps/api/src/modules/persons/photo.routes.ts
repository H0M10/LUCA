import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import { assertAccess } from '../trees/trees.service.js';

export const photosRouter: RouterType = Router();
photosRouter.use(authenticate);

const PersonParam = z.object({ id: z.string().uuid() });

/**
 * Acepta una data URL base64 (image/jpeg|png|webp) y la guarda en person.photo_data.
 * Frontend ya redimensiona y comprime con canvas antes de enviar.
 * Limite ~500KB para no inflar la BD.
 */
const PhotoSchema = z.object({
  dataUrl: z
    .string()
    .startsWith('data:image/')
    .max(700_000, 'Imagen muy grande (max 500KB después de redimensionar)'),
});

photosRouter.put(
  '/persons/:id/photo',
  validateParams(PersonParam),
  validateBody(PhotoSchema),
  async (req, res, next) => {
    try {
      const person = await prisma.person.findFirst({
        where: { id: req.params.id!, deleted_at: null },
      });
      if (!person) throw Errors.notFound('Persona');
      await assertAccess(person.tree_id, req.user!.id, 'edit');
      await prisma.person.update({
        where: { id: req.params.id! },
        data: { photo_data: req.body.dataUrl },
      });
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  },
);

photosRouter.delete('/persons/:id/photo', validateParams(PersonParam), async (req, res, next) => {
  try {
    const person = await prisma.person.findFirst({
      where: { id: req.params.id!, deleted_at: null },
    });
    if (!person) throw Errors.notFound('Persona');
    await assertAccess(person.tree_id, req.user!.id, 'edit');
    await prisma.person.update({
      where: { id: req.params.id! },
      data: { photo_data: null },
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
