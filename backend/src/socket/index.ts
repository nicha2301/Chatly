import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User, Message, Conversation } from '../models';
import mongoose from 'mongoose';

// Định nghĩa structure cho các sự kiện Socket
interface IJoinRoom {
  conversationId: string;
}

interface IMessage {
  conversationId: string;
  content: string;
  type?: string;
  isEncrypted?: boolean;
  metadata?: any;
}

interface ITyping {
  conversationId: string;
  isTyping: boolean;
}

interface IStatusUpdate {
  status: 'online' | 'offline';
}

// Khởi tạo Socket.IO server
export function initSocketServer(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000
  });

  // Middleware xác thực JWT
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your_jwt_secret_key'
      ) as { id: string };

      // Lấy thông tin user từ database
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      // Lưu thông tin user vào socket
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  // Xử lý kết nối Socket.IO
  io.on('connection', async (socket: any) => {
    const user = socket.user;
    console.log(`User connected: ${user.username}`);

    // Cập nhật trạng thái online
    await User.findByIdAndUpdate(user._id, {
      status: 'online',
      lastActive: new Date()
    });

    // Gửi sự kiện cập nhật trạng thái online cho các user khác
    socket.broadcast.emit('user:status', {
      userId: user._id,
      status: 'online'
    });

    // Lấy danh sách cuộc trò chuyện của user và tự động join vào mỗi room
    const conversations = await Conversation.find({
      participants: user._id
    });

    // Join vào các room của cuộc trò chuyện
    conversations.forEach(conversation => {
      if (conversation._id) {
        socket.join(String(conversation._id));
      }
    });

    // Xử lý sự kiện tham gia vào room chat
    socket.on('join:room', (data: IJoinRoom) => {
      socket.join(data.conversationId);
      console.log(`${user.username} joined room: ${data.conversationId}`);
    });

    // Xử lý sự kiện rời khỏi room chat
    socket.on('leave:room', (data: IJoinRoom) => {
      socket.leave(data.conversationId);
      console.log(`${user.username} left room: ${data.conversationId}`);
    });

    // Xử lý sự kiện gửi tin nhắn
    socket.on('message:send', async (data: IMessage) => {
      try {
        // Lưu tin nhắn vào database
        const message = await Message.create({
          conversationId: data.conversationId,
          senderId: user._id,
          content: data.content,
          type: data.type || 'text',
          readBy: [user._id],
          isEncrypted: data.isEncrypted || false,
          metadata: data.metadata
        });

        // Populate thông tin người gửi
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', '_id username avatar');

        // Cập nhật lastMessage trong conversation
        await Conversation.findByIdAndUpdate(
          data.conversationId,
          { lastMessage: message._id }
        );

        // Gửi tin nhắn đến tất cả client trong room
        io.to(data.conversationId).emit('message:receive', populatedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Xử lý sự kiện đang gõ
    socket.on('typing', (data: ITyping) => {
      // Broadcast đến tất cả client khác trong room
      socket.to(data.conversationId).emit('typing', {
        userId: user._id,
        username: user.username,
        isTyping: data.isTyping
      });
    });

    // Xử lý sự kiện cập nhật trạng thái
    socket.on('user:status', async (data: IStatusUpdate) => {
      try {
        // Cập nhật trạng thái trong database
        await User.findByIdAndUpdate(user._id, {
          status: data.status,
          lastActive: new Date()
        });

        // Broadcast trạng thái mới đến tất cả client
        io.emit('user:status', {
          userId: user._id,
          status: data.status
        });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    });

    // Xử lý sự kiện ngắt kết nối
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.username}`);

      // Cập nhật trạng thái offline
      await User.findByIdAndUpdate(user._id, {
        status: 'offline',
        lastActive: new Date()
      });

      // Broadcast trạng thái offline đến tất cả client
      socket.broadcast.emit('user:status', {
        userId: user._id,
        status: 'offline'
      });
    });
  });

  return io;
} 