import express from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
  revokeRole
} from '../controllers/roleController';
import { protect, isAdmin } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Tất cả routes bên dưới đều yêu cầu xác thực
router.use(protect);

// Tất cả routes bên dưới đều yêu cầu quyền admin
router.use(isAdmin);

// Routes
router.get('/', getRoles);
router.post('/', apiLimiter, createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);
router.post('/assign', assignRole);
router.post('/revoke', revokeRole);

export default router; 