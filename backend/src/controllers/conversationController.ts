import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Conversation, User } from '../models';
import AppError from '../utils/errorHandler';

// @desc    Tạo cuộc trò chuyện mới
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }
    
    const { participants, isGroup, groupName } = req.body;
    
    // Kiểm tra nếu là nhóm thì phải có tên nhóm
    if (isGroup && !groupName) {
      return next(new AppError('Cuộc trò chuyện nhóm cần có tên', 400));
    }

    // Thêm người dùng hiện tại vào danh sách người tham gia nếu chưa có
    const userId = req.user._id instanceof mongoose.Types.ObjectId ? req.user._id.toString() : String(req.user._id);
    const allParticipants = [...new Set([...participants, userId])];
    
    // Nếu không phải là nhóm và có 2 người tham gia, 
    // kiểm tra xem đã có cuộc trò chuyện nào giữa họ chưa
    if (!isGroup && allParticipants.length === 2) {
      const existingConversation = await Conversation.findOne({
        isGroup: false,
        participants: { 
          $all: allParticipants,
          $size: 2
        }
      });
      
      if (existingConversation) {
        return res.status(200).json({
          success: true,
          message: 'Cuộc trò chuyện đã tồn tại',
          conversation: existingConversation
        });
      }
    }
    
    // Kiểm tra người tham gia có tồn tại không
    const participantIds = allParticipants.map(p => new mongoose.Types.ObjectId(p));
    const usersCount = await User.countDocuments({
      _id: { $in: participantIds }
    });
    
    if (usersCount !== allParticipants.length) {
      return next(new AppError('Một hoặc nhiều người tham gia không tồn tại', 400));
    }
    
    // Tạo cuộc trò chuyện mới
    const conversation = await Conversation.create({
      participants: participantIds,
      isGroup,
      groupName: isGroup ? groupName : undefined,
      groupAdmins: isGroup ? [req.user._id] : [],
      metadata: {
        createdBy: req.user._id
      }
    });
    
    // Populate thông tin người tham gia
    await conversation.populate('participants', '_id username avatar status');
    
    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách cuộc trò chuyện
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }

    // Phân trang
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Lấy danh sách cuộc trò chuyện từ mới đến cũ
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', '_id username avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);
    
    // Đếm tổng số cuộc trò chuyện
    const totalCount = await Conversation.countDocuments({
      participants: req.user._id
    });
    
    res.status(200).json({
      success: true,
      count: conversations.length,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
      page,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết cuộc trò chuyện
// @route   GET /api/conversations/:id
// @access  Private
export const getConversationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Không tìm thấy thông tin người dùng', 401));
    }
    
    const conversationId = req.params.id;
    
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return next(new AppError('ID cuộc trò chuyện không hợp lệ', 400));
    }
    
    // Lấy chi tiết cuộc trò chuyện
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', '_id username avatar status')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: '_id username avatar'
        }
      });
    
    if (!conversation) {
      return next(new AppError('Không tìm thấy cuộc trò chuyện', 404));
    }
    
    // Kiểm tra người dùng có thuộc cuộc trò chuyện không
    const userId = req.user._id instanceof mongoose.Types.ObjectId ? req.user._id.toString() : String(req.user._id);
    if (!conversation.participants.some(
      p => p._id.toString() === userId
    )) {
      return next(new AppError('Không có quyền truy cập cuộc trò chuyện này', 403));
    }
    
    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
}; 