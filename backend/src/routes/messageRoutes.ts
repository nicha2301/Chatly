import express from 'express';
import {
  sendMessage,
  getMessages
} from '../controllers/messageController';
import { messageLimiter } from '../middleware/rateLimiter';
import { protect } from '../middleware/auth';

const router = express.Router();

// Tất cả routes bên dưới đều yêu cầu xác thực
router.use(protect);

// Routes
router.post('/', messageLimiter, sendMessage);
router.get('/:conversationId', getMessages);

export default router; 