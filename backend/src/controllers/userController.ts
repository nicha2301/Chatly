import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import AppError from '../utils/errorHandler';

// @desc    Lấy thông tin người dùng đã đăng nhập
// @route   GET /api/users/me
// @access  Private
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    // Lấy thông tin người dùng từ database để có thông tin mới nhất
    const user = await User.findById(req.user._id).populate('roles');
    
    if (!user) {
      return next(new AppError('Không tìm thấy người dùng', 404));
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastActive: user.lastActive,
        settings: user.settings,
        roles: user.roles
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/me
// @access  Private
export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    // Không cho phép cập nhật email hoặc mật khẩu từ route này
    if (req.body.password || req.body.email) {
      return next(new AppError('Route này không dùng để cập nhật email hoặc password', 400));
    }

    // Lọc các trường được phép cập nhật
    const allowedFields = ['username', 'avatar', 'settings'];
    const updateData: { [key: string]: any } = {};

    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        updateData[field] = req.body[field];
      }
    });

    // Cập nhật người dùng
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tìm kiếm người dùng
// @route   GET /api/users/search
// @access  Private
export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;

    if (!q) {
      return next(new AppError('Vui lòng cung cấp từ khóa tìm kiếm', 400));
    }

    // Tìm người dùng theo username hoặc email
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('_id username email avatar status');

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật trạng thái online/offline
// @route   PUT /api/users/status
// @access  Private
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    const { status } = req.body;

    if (!status || !['online', 'offline'].includes(status)) {
      return next(new AppError('Trạng thái không hợp lệ', 400));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        status,
        lastActive: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      status: updatedUser?.status
    });
  } catch (error) {
    next(error);
  }
}; 