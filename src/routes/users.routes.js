import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from '../services/users.service.js';
import { asyncHandler } from '../utils/apiError.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../validators/user.validator.js';

const router = Router();

// All user management routes require an authenticated ADMIN
router.use(authenticate, requireRoles('ADMIN'));

router.get(
  '/',
  validateQuery(listUsersQuerySchema),
  asyncHandler(async (req, res) => {
    const data = await listUsers(req.validatedQuery);
    res.json({ success: true, data });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.params.id);
    res.json({ success: true, data: { user } });
  }),
);

router.post(
  '/',
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await createUser(req.body);
    res.status(201).json({ success: true, data: { user } });
  }),
);

router.patch(
  '/:id',
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await updateUser(req.params.id, req.body);
    res.json({ success: true, data: { user } });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteUser(req.params.id);
    res.status(204).send();
  }),
);

export default router;
