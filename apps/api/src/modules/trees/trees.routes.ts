import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { TreeCreateSchema, TreeUpdateSchema } from '@genograma/shared';
import * as svc from './trees.service.js';
import * as members from './members.service.js';

export const treesRouter: RouterType = Router();
treesRouter.use(authenticate);

const IdParam = z.object({ id: z.string().uuid() });
const MemberIdParam = z.object({ id: z.string().uuid(), memberId: z.string().uuid() });

const InviteSchema = z.object({
  email: z.string().email().toLowerCase(),
  permission: z.enum(['read', 'edit', 'admin']).default('edit'),
});
const UpdateMemberSchema = z.object({
  permission: z.enum(['read', 'edit', 'admin']),
});

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

// ───────── Miembros / compartir ─────────
treesRouter.get('/:id/members', validateParams(IdParam), async (req, res, next) => {
  try {
    const data = await members.listMembers(req.params.id!, req.user!.id);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

treesRouter.post(
  '/:id/members',
  validateParams(IdParam),
  validateBody(InviteSchema),
  async (req, res, next) => {
    try {
      const m = await members.inviteMember(req.params.id!, req.user!.id, req.body.email, req.body.permission);
      res.status(201).json({ data: m });
    } catch (e) {
      next(e);
    }
  },
);

treesRouter.patch(
  '/:id/members/:memberId',
  validateParams(MemberIdParam),
  validateBody(UpdateMemberSchema),
  async (req, res, next) => {
    try {
      await members.updateMemberPermission(req.params.id!, req.user!.id, req.params.memberId!, req.body.permission);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);

treesRouter.delete(
  '/:id/members/:memberId',
  validateParams(MemberIdParam),
  async (req, res, next) => {
    try {
      await members.removeMember(req.params.id!, req.user!.id, req.params.memberId!);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);
