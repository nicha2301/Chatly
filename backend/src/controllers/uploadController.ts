import { Request, Response, NextFunction } from 'express';
import cloudinary from '../config/cloudinary';
import AppError from '../utils/errorHandler';

// @desc    Upload ảnh
// @route   POST /api/uploads/image
// @access  Private
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    if (!req.file) {
      return next(new AppError('Vui lòng chọn file ảnh để tải lên', 400));
    }

    const file = req.file as Express.Multer.File & { 
      path: string;
      filename: string;
    };

    // Trả về thông tin file đã tải lên từ Cloudinary
    res.status(201).json({
      success: true,
      file: {
        filename: file.filename || '',
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        url: file.path,
        secureUrl: file.path.replace('http://', 'https://'),
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload document
// @route   POST /api/uploads/document
// @access  Private
export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    if (!req.file) {
      return next(new AppError('Vui lòng chọn tài liệu để tải lên', 400));
    }

    const file = req.file as Express.Multer.File & { 
      path: string;
      filename: string;
    };

    // Trả về thông tin document đã tải lên
    res.status(201).json({
      success: true,
      file: {
        filename: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        url: file.path,
        secureUrl: file.path.replace('http://', 'https://'),
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa file khỏi Cloudinary
// @route   DELETE /api/uploads/:publicId
// @access  Private
export const deleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    const { publicId } = req.params;
    const { type } = req.query;

    if (!publicId) {
      return next(new AppError('Thiếu thông tin publicId', 400));
    }

    // Xóa file từ Cloudinary
    const result = await cloudinary.uploader.destroy(
      publicId,
      { resource_type: type === 'raw' ? 'raw' : 'image' }
    );

    if (result.result !== 'ok') {
      return next(new AppError('Không thể xóa file', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Xóa file thành công'
    });
  } catch (error) {
    next(error);
  }
}; 