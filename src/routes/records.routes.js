import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createRecord,
  getRecordById,
  listRecords,
  softDeleteRecord,
  updateRecord,
} from '../services/records.service.js';
import { asyncHandler } from '../utils/apiError.js';
import {
  createRecordSchema,
  listRecordsQuerySchema,
  updateRecordSchema,
} from '../validators/record.validator.js';

const router = Router();

// ANALYST and ADMIN can read records; only ADMIN can write
const readRoles = requireRoles('ANALYST', 'ADMIN');
const writeRoles = requireRoles('ADMIN');

router.get(
  '/',
  authenticate,
  readRoles,
  validateQuery(listRecordsQuerySchema),
  asyncHandler(async (req, res) => {
    const data = await listRecords(req.validatedQuery);
    res.json({ success: true, data });
  }),
);

router.get(
  '/:id',
  authenticate,
  readRoles,
  asyncHandler(async (req, res) => {
    const record = await getRecordById(req.params.id);
    res.json({ success: true, data: { record } });
  }),
);

router.post(
  '/',
  authenticate,
  writeRoles,
  validateBody(createRecordSchema),
  asyncHandler(async (req, res) => {
    const record = await createRecord(req.body, req.user);
    res.status(201).json({ success: true, data: { record } });
  }),
);

router.patch(
  '/:id',
  authenticate,
  writeRoles,
  validateBody(updateRecordSchema),
  asyncHandler(async (req, res) => {
    const record = await updateRecord(req.params.id, req.body, req.user);
    res.json({ success: true, data: { record } });
  }),
);

router.delete(
  '/:id',
  authenticate,
  writeRoles,
  asyncHandler(async (req, res) => {
    const record = await softDeleteRecord(req.params.id);
    res.json({
      success: true,
      data: { record, message: 'Record soft-deleted' },
    });
  }),
);

export default router;
