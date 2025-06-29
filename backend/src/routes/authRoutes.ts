import express from 'express';
import { 
  registerUser,
  loginUser, 
  refreshToken,
  logoutUser 
} from '../controllers/authController';
import { 
  loginLimiter,
  registerLimiter
} from '../middleware/rateLimiter';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', protect, logoutUser);

export default router; 