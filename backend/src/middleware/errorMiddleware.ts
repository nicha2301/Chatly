import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/errorHandler';

interface ErrorResponse {
  message: string;
  stack?: string;
  error?: {
    [key: string]: any;
  };
}

// Not found middleware
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Không tìm thấy ${req.originalUrl}`, 404);
  next(error);
};

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  
  const errorResponse: ErrorResponse = {
    message: err.message || 'Lỗi máy chủ',
  };
  
  // Stack trace chỉ hiển thị trong môi trường phát triển
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    
    // Nếu là lỗi xác thực từ mongoose
    if (err.name === 'ValidationError') {
      errorResponse.error = err;
    }
    
    // Nếu là lỗi trùng lặp từ MongoDB
    if (err.name === 'MongoError' && (err as any).code === 11000) {
      errorResponse.message = 'Dữ liệu bị trùng lặp';
      errorResponse.error = (err as any).keyValue;
    }
    
    // Nếu là lỗi JSON Web Token
    if (err.name === 'JsonWebTokenError') {
      errorResponse.message = 'Token không hợp lệ';
    }
    
    // Nếu là lỗi hết hạn JWT
    if (err.name === 'TokenExpiredError') {
      errorResponse.message = 'Token đã hết hạn';
    }
  }

  res.status(statusCode).json(errorResponse);
}; 