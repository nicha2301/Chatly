import { setCache, getCache, deleteCache } from '../config/redis';

// Prefix để phân biệt các loại cache
const CACHE_PREFIX = {
  CONVERSATION: 'conversation',
  CONVERSATIONS_LIST: 'conversations_list',
  MESSAGES: 'messages',
  USER: 'user',
  USERS_SEARCH: 'users_search'
};

// Thời gian hết hạn (seconds)
const CACHE_TTL = {
  CONVERSATION: 60 * 5, // 5 phút
  CONVERSATIONS_LIST: 60 * 2, // 2 phút
  MESSAGES: 60, // 1 phút
  USER: 60 * 15, // 15 phút
  USERS_SEARCH: 60 * 10 // 10 phút
};

// Tạo key cho cache
const generateCacheKey = (prefix: string, id: string): string => `${prefix}:${id}`;

// Cache service cho cuộc trò chuyện
export const conversationCache = {
  // Lưu cache cuộc trò chuyện
  setConversation: async (conversationId: string, data: any): Promise<void> => {
    await setCache(
      generateCacheKey(CACHE_PREFIX.CONVERSATION, conversationId),
      data,
      CACHE_TTL.CONVERSATION
    );
  },

  // Lấy cache cuộc trò chuyện
  getConversation: async <T>(conversationId: string): Promise<T | null> => {
    return await getCache<T>(generateCacheKey(CACHE_PREFIX.CONVERSATION, conversationId));
  },

  // Xóa cache cuộc trò chuyện
  deleteConversation: async (conversationId: string): Promise<void> => {
    await deleteCache(generateCacheKey(CACHE_PREFIX.CONVERSATION, conversationId));
  },

  // Lưu cache danh sách cuộc trò chuyện
  setConversationsList: async (userId: string, data: any, page: number = 1): Promise<void> => {
    await setCache(
      generateCacheKey(CACHE_PREFIX.CONVERSATIONS_LIST, `${userId}:${page}`),
      data,
      CACHE_TTL.CONVERSATIONS_LIST
    );
  },

  // Lấy cache danh sách cuộc trò chuyện
  getConversationsList: async <T>(userId: string, page: number = 1): Promise<T | null> => {
    return await getCache<T>(generateCacheKey(CACHE_PREFIX.CONVERSATIONS_LIST, `${userId}:${page}`));
  },

  // Xóa cache danh sách cuộc trò chuyện
  deleteConversationsList: async (userId: string, page: number = 1): Promise<void> => {
    await deleteCache(generateCacheKey(CACHE_PREFIX.CONVERSATIONS_LIST, `${userId}:${page}`));
  }
};

// Cache service cho tin nhắn
export const messageCache = {
  // Lưu cache tin nhắn
  setMessages: async (conversationId: string, data: any, page: number = 1): Promise<void> => {
    await setCache(
      generateCacheKey(CACHE_PREFIX.MESSAGES, `${conversationId}:${page}`),
      data,
      CACHE_TTL.MESSAGES
    );
  },

  // Lấy cache tin nhắn
  getMessages: async <T>(conversationId: string, page: number = 1): Promise<T | null> => {
    return await getCache<T>(generateCacheKey(CACHE_PREFIX.MESSAGES, `${conversationId}:${page}`));
  },

  // Xóa cache tin nhắn
  deleteMessages: async (conversationId: string, page: number = 1): Promise<void> => {
    await deleteCache(generateCacheKey(CACHE_PREFIX.MESSAGES, `${conversationId}:${page}`));
  }
};

// Cache service cho người dùng
export const userCache = {
  // Lưu cache người dùng
  setUser: async (userId: string, data: any): Promise<void> => {
    await setCache(
      generateCacheKey(CACHE_PREFIX.USER, userId),
      data,
      CACHE_TTL.USER
    );
  },

  // Lấy cache người dùng
  getUser: async <T>(userId: string): Promise<T | null> => {
    return await getCache<T>(generateCacheKey(CACHE_PREFIX.USER, userId));
  },

  // Xóa cache người dùng
  deleteUser: async (userId: string): Promise<void> => {
    await deleteCache(generateCacheKey(CACHE_PREFIX.USER, userId));
  },

  // Lưu cache kết quả tìm kiếm người dùng
  setUsersSearch: async (query: string, data: any): Promise<void> => {
    await setCache(
      generateCacheKey(CACHE_PREFIX.USERS_SEARCH, query),
      data,
      CACHE_TTL.USERS_SEARCH
    );
  },

  // Lấy cache kết quả tìm kiếm người dùng
  getUsersSearch: async <T>(query: string): Promise<T | null> => {
    return await getCache<T>(generateCacheKey(CACHE_PREFIX.USERS_SEARCH, query));
  },

  // Xóa cache kết quả tìm kiếm người dùng
  deleteUsersSearch: async (query: string): Promise<void> => {
    await deleteCache(generateCacheKey(CACHE_PREFIX.USERS_SEARCH, query));
  }
}; 