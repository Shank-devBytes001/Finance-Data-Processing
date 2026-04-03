import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { validateQuery } from '../middleware/validate.js';
import { getDashboardSummary } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/apiError.js';
import { dashboardQuerySchema } from '../validators/record.validator.js';

const router = Router();

// Any authenticated role (VIEWER+) can access the high-level dashboard summary
router.get(
  '/summary',
  authenticate,
  requireRoles('VIEWER', 'ANALYST', 'ADMIN'),
  validateQuery(dashboardQuerySchema),
  asyncHandler(async (req, res) => {
    const data = await getDashboardSummary(req.validatedQuery);
    res.json({ success: true, data });
  }),
);

export default router;
