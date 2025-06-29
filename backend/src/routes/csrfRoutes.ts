import express from 'express';
import { generateCsrfToken } from '../middleware/csrfMiddleware';
import { protect } from '../middleware/auth';

const router = express.Router();

// Route để lấy CSRF token
router.get('/token', protect, generateCsrfToken);

export default router; 