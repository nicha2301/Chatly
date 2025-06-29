import express from 'express';
import {
  getMe,
  updateMe,
  searchUsers,
  updateStatus
} from '../controllers/userController';
import { protect } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Tất cả routes bên dưới đều yêu cầu xác thực
router.use(protect);

// Routes
router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/search', apiLimiter, searchUsers);
router.put('/status', updateStatus);

export default router; 