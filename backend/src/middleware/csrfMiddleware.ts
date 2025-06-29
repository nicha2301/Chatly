import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import AppError from '../utils/errorHandler';

// Lưu trữ tokens
const csrfTokens = new Map<string, { token: string; expires: Date }>();

// Thời gian hết hạn token (1 giờ)
const TOKEN_EXPIRY = 60 * 60 * 1000;

// Tạo CSRF token
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');
    
    // Lưu token với thời gian hết hạn
    const expires = new Date(Date.now() + TOKEN_EXPIRY);
    csrfTokens.set(token, { token, expires });
    
    // Gửi token cho client
    res.cookie('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires
    });
    
    // Gửi token trong response để client có thể sử dụng trong header
    res.status(200).json({
      success: true,
      csrfToken: token
    });
  } catch (error) {
    next(error);
  }
};

// Kiểm tra CSRF token
export const validateCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Lấy token từ header
    const csrfHeader = req.headers['x-csrf-token'];
    
    // Lấy token từ cookie
    const csrfCookie = req.cookies['csrf-token'];
    
    // Kiểm tra token có tồn tại không
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return next(new AppError('CSRF token không hợp lệ', 403));
    }
    
    // Lấy thông tin token từ storage
    const tokenData = csrfTokens.get(csrfHeader as string);
    
    // Kiểm tra token có tồn tại trong storage không
    if (!tokenData) {
      return next(new AppError('CSRF token không hợp lệ', 403));
    }
    
    // Kiểm tra token có hết hạn không
    if (tokenData.expires < new Date()) {
      // Xóa token hết hạn
      csrfTokens.delete(csrfHeader as string);
      return next(new AppError('CSRF token đã hết hạn', 403));
    }
    
    // Token hợp lệ
    next();
  } catch (error) {
    next(error);
  }
};

// Xóa các token hết hạn
const cleanupExpiredTokens = (): void => {
  const now = new Date();
  
  csrfTokens.forEach((tokenData, key) => {
    if (tokenData.expires < now) {
      csrfTokens.delete(key);
    }
  });
};

// Chạy cleanup mỗi giờ
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

export default { generateCsrfToken, validateCsrfToken }; 