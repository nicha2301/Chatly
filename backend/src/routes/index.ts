import express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import conversationRoutes from './conversationRoutes';
import messageRoutes from './messageRoutes';
import uploadRoutes from './uploadRoutes';
import roleRoutes from './roleRoutes';
import csrfRoutes from './csrfRoutes';
import notificationRoutes from './notificationRoutes';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/uploads', uploadRoutes);
router.use('/roles', roleRoutes);
router.use('/csrf', csrfRoutes);
router.use('/notifications', notificationRoutes);

export default router; 