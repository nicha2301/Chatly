import express from 'express';
import {
  createConversation,
  getConversations,
  getConversationById
} from '../controllers/conversationController';
import { messageLimiter } from '../middleware/rateLimiter';
import { protect } from '../middleware/auth';

const router = express.Router();

// Tất cả routes bên dưới đều yêu cầu xác thực
router.use(protect);

// Routes
router.post('/', messageLimiter, createConversation);
router.get('/', getConversations);
router.get('/:id', getConversationById);

export default router; 