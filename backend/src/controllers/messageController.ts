import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Message, Conversation, User } from '../models';
import AppError from '../utils/errorHandler';

// @desc    Gửi tin nhắn mới
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    const { conversationId, content, type, isEncrypted, metadata } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!conversationId || !content) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin tin nhắn', 400));
    }

    // Kiểm tra cuộc trò chuyện tồn tại không
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Không tìm thấy cuộc trò chuyện', 404));
    }

    // Kiểm tra người dùng có trong cuộc trò chuyện không
    const userId = String(req.user._id);
    if (!conversation.participants.some(p => String(p) === userId)) {
      return next(new AppError('Bạn không thuộc cuộc trò chuyện này', 403));
    }

    // Tạo tin nhắn mới
    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      content,
      type: type || 'text',
      readBy: [req.user._id], // Người gửi đã đọc tin nhắn
      isEncrypted: isEncrypted || false,
      metadata
    });

    // Populate thông tin người gửi
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', '_id username avatar');

    // Thêm lastMessage vào cuộc trò chuyện
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id
    });

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tin nhắn của cuộc trò chuyện
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }
    
    const { conversationId } = req.params;
    
    // Phân trang
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return next(new AppError('ID cuộc trò chuyện không hợp lệ', 400));
    }
    
    // Kiểm tra cuộc trò chuyện tồn tại không
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Không tìm thấy cuộc trò chuyện', 404));
    }
    
    // Kiểm tra người dùng có trong cuộc trò chuyện không
    const userId = String(req.user._id);
    if (!conversation.participants.some(p => String(p) === userId)) {
      return next(new AppError('Bạn không thuộc cuộc trò chuyện này', 403));
    }
    
    // Lấy tin nhắn từ cũ đến mới
    const messages = await Message.find({ conversationId })
      .populate('senderId', '_id username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Đếm tổng số tin nhắn
    const totalCount = await Message.countDocuments({ conversationId });
    
    // Đánh dấu là đã đọc các tin nhắn
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      {
        $addToSet: { readBy: req.user._id }
      }
    );
    
    res.status(200).json({
      success: true,
      count: messages.length,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      page,
      messages: messages.reverse() // Đảo ngược để hiển thị từ cũ đến mới
    });
  } catch (error) {
    next(error);
  }
}; 