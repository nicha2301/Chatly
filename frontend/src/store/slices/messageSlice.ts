import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, MessageStatus } from '../../types';

interface MessagesState {
  messages: Record<string, Message[]>; // conversationId -> messages
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: {},
  isLoading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Đặt toàn bộ tin nhắn cho một cuộc trò chuyện
    setMessages: (
      state,
      action: PayloadAction<{ conversationId: string; messages: Message[] }>
    ) => {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
      state.isLoading = false;
      state.error = null;
    },
    
    // Thêm một tin nhắn mới vào cuộc trò chuyện
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const conversationId = message.conversationId;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Thêm tin nhắn và sắp xếp theo thời gian
      state.messages[conversationId] = [
        ...state.messages[conversationId],
        message,
      ].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeA - timeB;
      });
    },
    
    // Cập nhật trạng thái một tin nhắn
    updateMessageStatus: (
      state,
      action: PayloadAction<{
        messageId: string;
        conversationId: string;
        status: MessageStatus;
      }>
    ) => {
      const { messageId, conversationId, status } = action.payload;
      
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex(
          (m) => m.id === messageId
        );
        
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex].status = status;
        }
      }
    },
    
    // Đánh dấu tin nhắn đã đọc
    markMessagesAsRead: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string }>
    ) => {
      const { conversationId, userId } = action.payload;
      
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map(message => {
          if (!message.readBy?.includes(userId)) {
            return {
              ...message,
              readBy: [...(message.readBy || []), userId]
            };
          }
          return message;
        });
      }
    },
    
    // Xóa tin nhắn
    deleteMessage: (
      state,
      action: PayloadAction<{ messageId: string; conversationId: string }>
    ) => {
      const { messageId, conversationId } = action.payload;
      
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex(
          (m) => m.id === messageId
        );
        
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex].deleted = true;
          state.messages[conversationId][messageIndex].content = "";
        }
      }
    },
    
    // Bắt đầu loading
    startLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    // Đặt lỗi
    setError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  setMessages,
  addMessage,
  updateMessageStatus,
  markMessagesAsRead,
  deleteMessage,
  startLoading,
  setError,
} = messageSlice.actions;

export default messageSlice.reducer;
