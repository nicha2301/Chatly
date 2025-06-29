import { Request, Response, NextFunction } from 'express';
import { User, Role, RoleType } from '../models';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import AppError from '../utils/errorHandler';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

interface RegisterUserRequest extends Request {
  body: {
    username: string;
    email: string;
    password: string;
    confirmPassword?: string;
  };
}

interface LoginUserRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface RefreshTokenRequest extends Request {
  body: {
    refreshToken: string;
  };
}

// @desc    Đăng ký người dùng mới
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (
  req: RegisterUserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!username || !email || !password) {
      return next(new AppError('Vui lòng điền đầy đủ thông tin', 400));
    }

    // Kiểm tra password và confirmPassword nếu có
    if (confirmPassword && password !== confirmPassword) {
      return next(new AppError('Mật khẩu và xác nhận mật khẩu không khớp', 400));
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email đã được sử dụng', 400));
    }

    // Tìm role "user" mặc định
    const userRole = await Role.findOne({ name: RoleType.USER });
    if (!userRole) {
      return next(new AppError('Lỗi hệ thống: không tìm thấy vai trò người dùng', 500));
    }

    // Tạo người dùng mới
    const user = await User.create({
      username,
      email,
      password,
      roles: [userRole._id]
    });

    // Tạo token
    const token = generateToken(user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id));
    const refreshToken = generateRefreshToken(user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id));

    // Trả về thông tin người dùng (không bao gồm password)
    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        roles: user.roles
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng nhập người dùng
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (
  req: LoginUserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!email || !password) {
      return next(new AppError('Vui lòng cung cấp email và mật khẩu', 400));
    }

    // Tìm người dùng và bao gồm password để kiểm tra
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Email hoặc mật khẩu không đúng', 401));
    }

    // Cập nhật trạng thái online
    user.status = 'online';
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    // Tạo token
    const token = generateToken(user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id));
    const refreshToken = generateRefreshToken(user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id));

    // Trả về thông tin người dùng (không bao gồm password)
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        roles: user.roles
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Làm mới token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (
  req: RefreshTokenRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken: requestToken } = req.body;

    if (!requestToken) {
      return next(new AppError('Refresh token không được cung cấp', 400));
    }

    // Verify refresh token
    const decoded = require('jsonwebtoken').verify(
      requestToken,
      process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key'
    );

    const userId = decoded.id;

    // Kiểm tra người dùng có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    // Tạo token mới
    const newAccessToken = generateToken(user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id));

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: requestToken
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token đã hết hạn', 401));
    }

    next(error);
  }
};

// @desc    Đăng xuất người dùng
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    // Cập nhật trạng thái offline
    await User.findByIdAndUpdate(req.user._id, {
      status: 'offline',
      lastActive: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    next(error);
  }
}; 