import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import { User, Role, RoleType } from '../models';
import AppError from '../utils/errorHandler';

// Extended Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Interface for JWT payload
interface JwtPayload {
  id: string;
  role: string;
}

/**
 * Auth middleware to protect routes
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    }

    // Kiểm tra token có tồn tại không
    if (!token) {
      return next(new AppError('Vui lòng đăng nhập để truy cập', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your_jwt_secret_key'
      ) as { id: string };

      // Get user from DB and attach to request
      // Exclude password from the returned data
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new AppError('Người dùng không tồn tại', 401));
      }

      req.user = user;
      next();
    } catch (error) {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 401));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Admin role middleware
 */
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    // Lấy danh sách vai trò của người dùng
    const userRoles = await Role.find({ _id: { $in: req.user.roles } });
    
    // Kiểm tra xem người dùng có vai trò admin không
    const isUserAdmin = userRoles.some(role => role.name === RoleType.ADMIN);
    
    if (!isUserAdmin) {
      return next(new AppError('Không có quyền truy cập, yêu cầu quyền admin', 403));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Moderator role middleware
 */
export const moderator = (req: Request, res: Response, next: NextFunction): void => {
  if (
    req.user && 
    (req.user.roles.some(role => role.toString() === 'moderator') || 
     req.user.roles.some(role => role.toString() === 'admin'))
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as moderator' });
    return;
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your_jwt_secret_key'
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key'
  );
};

// Middleware kiểm tra quyền dựa trên vai trò
export const hasRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Không tìm thấy thông tin người dùng', 401));
      }

      // Lấy danh sách vai trò của người dùng
      const userRoles = await Role.find({ _id: { $in: req.user.roles } });
      
      // Kiểm tra xem người dùng có vai trò yêu cầu không
      const hasRequiredRole = userRoles.some(role => roles.includes(role.name));
      
      if (!hasRequiredRole) {
        return next(new AppError('Không có quyền truy cập', 403));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}; 