import express from 'express';
import {
  registerDevice,
  unregisterDevice,
  sendUserNotification,
  sendSelfNotification
} from '../controllers/notificationController';
import { protect, isAdmin } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Tất cả routes bên dưới đều yêu cầu xác thực
router.use(protect);

// Routes cho người dùng
router.post('/register-device', apiLimiter, registerDevice);
router.post('/unregister-device', unregisterDevice);
router.post('/send-to-me', apiLimiter, sendSelfNotification);

// Routes chỉ dành cho admin
router.post('/send', isAdmin, apiLimiter, sendUserNotification);

export default router; 