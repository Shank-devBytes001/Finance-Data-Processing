import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { getUserProfile, login } from '../services/auth.service.js';
import { loginSchema } from '../validators/auth.validator.js';
import { asyncHandler } from '../utils/apiError.js';

const router = Router();

// Public login endpoint that issues a JWT on successful authentication
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  }),
);

// Get the authenticated user's profile, reflecting up-to-date DB state
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await getUserProfile(req.user.id);
    res.json({ success: true, data: { user } });
  }),
);

export default router;
