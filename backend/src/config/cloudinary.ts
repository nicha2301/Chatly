import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import AppError from '../utils/errorHandler';

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

// Kiểm tra kích thước file (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Kiểm tra loại file cho ảnh
const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Chấp nhận jpg, jpeg, png, gif
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }

  return cb(new AppError('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)', 400) as any);
};

// Storage cho ảnh
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chatly/images',
    format: async (req: Express.Request, file: Express.Multer.File) => {
      // Giữ định dạng gốc hoặc chuyển sang jpg
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        return 'jpg';
      }
      if (file.mimetype === 'image/png') {
        return 'png';
      }
      if (file.mimetype === 'image/gif') {
        return 'gif';
      }
      return 'jpg';
    },
    public_id: (req: Express.Request, file: Express.Multer.File) => {
      // Tạo public_id sử dụng timestamp và một phần của originalname
      const timestamp = Date.now();
      const fileName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      return `${fileName}_${timestamp}`;
    },
    transformation: [
      { width: 1000, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  } as any
});

// Kiểm tra loại file cho documents
const docFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Chấp nhận pdf, doc, docx, xls, xlsx, txt
  const filetypes = /pdf|doc|docx|xls|xlsx|txt/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }

  return cb(new AppError('Định dạng file không được hỗ trợ', 400) as any);
};

// Storage cho documents
const docStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chatly/documents',
    resource_type: 'raw',
    public_id: (req: Express.Request, file: Express.Multer.File) => {
      // Tạo public_id sử dụng timestamp và một phần của originalname
      const timestamp = Date.now();
      const fileName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const fileExt = path.extname(file.originalname).toLowerCase();
      return `${fileName}_${timestamp}${fileExt}`;
    }
  } as any
});

// Multer upload cho ảnh
export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter
});

// Multer upload cho documents
export const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: MAX_FILE_SIZE * 2 }, // 10MB cho documents
  fileFilter: docFileFilter
});

export default cloudinary; 