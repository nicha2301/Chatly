import express from 'express';
import {
  uploadImage as uploadImageController,
  uploadDocument,
  deleteFile
} from '../controllers/uploadController';
import { uploadImage, uploadDoc } from '../config/cloudinary';
import { protect } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Tất cả routes bên dưới đều yêu cầu xác thực
router.use(protect);

// Routes
router.post(
  '/image', 
  apiLimiter,
  uploadImage.single('image'), 
  uploadImageController
);

router.post(
  '/document', 
  apiLimiter,
  uploadDoc.single('document'), 
  uploadDocument
);

router.delete('/:publicId', deleteFile);

export default router; 