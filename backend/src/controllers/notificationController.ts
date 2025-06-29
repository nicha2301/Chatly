import { Request, Response, NextFunction } from 'express';
import { Device } from '../models';
import AppError from '../utils/errorHandler';
import { sendNotification, sendMulticastNotification } from '../config/firebase';

// @desc    Đăng ký thiết bị để nhận thông báo
// @route   POST /api/notifications/register-device
// @access  Private
export const registerDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    const { token, platform, deviceId, model } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!token || !platform || !deviceId) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin thiết bị', 400));
    }

    // Kiểm tra platform hợp lệ
    if (!['ios', 'android', 'web'].includes(platform)) {
      return next(new AppError('Platform không hợp lệ', 400));
    }

    // Tìm thiết bị đã tồn tại
    let device = await Device.findOne({
      userId: req.user._id,
      deviceId
    });

    if (device) {
      // Cập nhật token và trạng thái
      device.token = token;
      device.platform = platform;
      device.model = model || device.model;
      device.isActive = true;
      device.lastUsed = new Date();
      await device.save();
    } else {
      // Tạo thiết bị mới
      device = await Device.create({
        userId: req.user._id,
        token,
        platform,
        deviceId,
        model,
        isActive: true
      });
    }

    res.status(200).json({
      success: true,
      device: {
        id: device._id,
        platform: device.platform,
        deviceId: device.deviceId,
        isActive: device.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hủy đăng ký thiết bị
// @route   POST /api/notifications/unregister-device
// @access  Private
export const unregisterDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    const { deviceId } = req.body;

    if (!deviceId) {
      return next(new AppError('Vui lòng cung cấp deviceId', 400));
    }

    // Tìm và cập nhật trạng thái thiết bị
    const device = await Device.findOne({
      userId: req.user._id,
      deviceId
    });

    if (!device) {
      return next(new AppError('Không tìm thấy thiết bị', 404));
    }

    // Cập nhật trạng thái
    device.isActive = false;
    await device.save();

    res.status(200).json({
      success: true,
      message: 'Hủy đăng ký thiết bị thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gửi thông báo đến người dùng
// @route   POST /api/notifications/send
// @access  Private
export const sendUserNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    const { userId, title, body, data } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!userId || !title || !body) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin thông báo', 400));
    }

    // Tìm thiết bị của người dùng
    const devices = await Device.find({
      userId,
      isActive: true
    });

    if (devices.length === 0) {
      return next(new AppError('Không tìm thấy thiết bị của người dùng', 404));
    }

    // Lấy danh sách token
    const tokens = devices.map(device => device.token);

    // Gửi thông báo
    const response = await sendMulticastNotification(tokens, title, body, data);

    if (!response) {
      return next(new AppError('Không thể gửi thông báo', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Gửi thông báo thành công',
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gửi thông báo đến thiết bị hiện tại
// @route   POST /api/notifications/send-to-me
// @access  Private
export const sendSelfNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    const { title, body, data, deviceId } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!title || !body) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin thông báo', 400));
    }

    // Tìm thiết bị của người dùng
    let query: any = {
      userId: req.user._id,
      isActive: true
    };

    // Nếu có deviceId, chỉ gửi đến thiết bị đó
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const devices = await Device.find(query);

    if (devices.length === 0) {
      return next(new AppError('Không tìm thấy thiết bị', 404));
    }

    // Lấy danh sách token
    const tokens = devices.map(device => device.token);

    // Gửi thông báo
    const response = await sendMulticastNotification(tokens, title, body, data);

    if (!response) {
      return next(new AppError('Không thể gửi thông báo', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Gửi thông báo thành công',
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error) {
    next(error);
  }
}; 