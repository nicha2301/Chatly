import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Role, User } from '../models';
import AppError from '../utils/errorHandler';

// @desc    Lấy danh sách vai trò
// @route   GET /api/roles
// @access  Private/Admin
export const getRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roles = await Role.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: roles.length,
      roles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo vai trò mới
// @route   POST /api/roles
// @access  Private/Admin
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, permissions } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name) {
      return next(new AppError('Vui lòng cung cấp tên vai trò', 400));
    }

    // Kiểm tra vai trò đã tồn tại chưa
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return next(new AppError('Vai trò đã tồn tại', 400));
    }

    // Tạo vai trò mới
    const role = await Role.create({
      name,
      description,
      permissions
    });

    res.status(201).json({
      success: true,
      role
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật vai trò
// @route   PUT /api/roles/:id
// @access  Private/Admin
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { description, permissions } = req.body;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('ID vai trò không hợp lệ', 400));
    }

    // Không cho phép thay đổi tên vai trò
    if (req.body.name) {
      return next(new AppError('Không thể thay đổi tên vai trò', 400));
    }

    // Cập nhật vai trò
    const role = await Role.findByIdAndUpdate(
      id,
      { description, permissions },
      { new: true, runValidators: true }
    );

    if (!role) {
      return next(new AppError('Không tìm thấy vai trò', 404));
    }

    res.status(200).json({
      success: true,
      role
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa vai trò
// @route   DELETE /api/roles/:id
// @access  Private/Admin
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('ID vai trò không hợp lệ', 400));
    }

    // Kiểm tra vai trò có tồn tại không
    const role = await Role.findById(id);
    if (!role) {
      return next(new AppError('Không tìm thấy vai trò', 404));
    }

    // Kiểm tra vai trò có đang được sử dụng không
    const usersWithRole = await User.countDocuments({ roles: id });
    if (usersWithRole > 0) {
      return next(new AppError('Vai trò đang được sử dụng bởi người dùng, không thể xóa', 400));
    }

    // Xóa vai trò
    await Role.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Vai trò đã được xóa'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gán vai trò cho người dùng
// @route   POST /api/roles/assign
// @access  Private/Admin
export const assignRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, roleId } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!userId || !roleId) {
      return next(new AppError('Vui lòng cung cấp userId và roleId', 400));
    }

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(roleId)) {
      return next(new AppError('ID không hợp lệ', 400));
    }

    // Kiểm tra người dùng có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Kiểm tra vai trò có tồn tại không
    const role = await Role.findById(roleId);
    if (!role) {
      return next(new AppError('Không tìm thấy vai trò', 404));
    }

    // Kiểm tra người dùng đã có vai trò này chưa
    const roleIdStr = String(role._id);
    if (user.roles.some(r => String(r) === roleIdStr)) {
      return next(new AppError('Người dùng đã có vai trò này', 400));
    }

    // Thêm vai trò cho người dùng
    const roleObjectId = new mongoose.Types.ObjectId(roleId);
    user.roles.push(roleObjectId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Vai trò đã được gán cho người dùng',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gỡ bỏ vai trò khỏi người dùng
// @route   POST /api/roles/revoke
// @access  Private/Admin
export const revokeRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, roleId } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!userId || !roleId) {
      return next(new AppError('Vui lòng cung cấp userId và roleId', 400));
    }

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(roleId)) {
      return next(new AppError('ID không hợp lệ', 400));
    }

    // Kiểm tra người dùng có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Kiểm tra vai trò có tồn tại không
    const role = await Role.findById(roleId);
    if (!role) {
      return next(new AppError('Không tìm thấy vai trò', 404));
    }

    // Kiểm tra người dùng có vai trò này không
    const roleIdStr = String(role._id);
    if (!user.roles.some(r => String(r) === roleIdStr)) {
      return next(new AppError('Người dùng không có vai trò này', 400));
    }

    // Kiểm tra người dùng có ít nhất một vai trò
    if (user.roles.length <= 1) {
      return next(new AppError('Không thể gỡ bỏ vai trò cuối cùng của người dùng', 400));
    }

    // Gỡ bỏ vai trò khỏi người dùng
    user.roles = user.roles.filter(r => String(r) !== roleIdStr);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Vai trò đã được gỡ bỏ khỏi người dùng',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    next(error);
  }
}; 