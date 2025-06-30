// Kiểu dữ liệu người dùng
export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  status?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Kiểu dữ liệu người tham gia cuộc trò chuyện
export interface Participant {
  id: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

// Kiểu dữ liệu tin nhắn
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'location';
  status?: MessageStatus;
  readBy?: string[];
  deleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  sender?: User;
}

// Kiểu dữ liệu cuộc trò chuyện
export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  avatarUrl?: string;
  lastMessage?: Message;
  unreadCount?: number;
  participants: User[];
  createdAt: string;
  updatedAt?: string;
}

// Kiểu dữ liệu tệp đính kèm
export interface Attachment {
  id: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'audio';
  name: string;
  size: number;
  thumbnailUrl?: string;
}

// Kiểu dữ liệu thông báo
export interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'group_invite' | 'system';
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// Loại thông báo
export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPT = 'friend_accept',
  GROUP_INVITE = 'group_invite',
  SYSTEM = 'system'
}

// Trạng thái bạn bè
export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked'
}

// Thiết lập theme
export type Theme = 'light' | 'dark' | 'system';

// Thiết lập ngôn ngữ
export type Language = 'en' | 'vi';

// Cấu hình thông báo
export interface NotificationSettings {
  newMessage: boolean;
  messagePreview: boolean;
  groupMessages: boolean;
  friendRequests: boolean;
  mentions: boolean;
  sounds: boolean;
  vibrations: boolean;
}

// Cấu hình quyền riêng tư
export interface PrivacySettings {
  lastSeen: PrivacyOption;
  profilePhoto: PrivacyOption;
  status: PrivacyOption;
  readReceipts: boolean;
}

// Tùy chọn quyền riêng tư
export enum PrivacyOption {
  EVERYONE = 'everyone',
  CONTACTS = 'contacts',
  NOBODY = 'nobody'
}

// Kiểu dữ liệu lỗi
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: { [key: string]: string[] };
}

// Kiểu dữ liệu phân trang
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// Cài đặt ứng dụng
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  chatSettings: {
    fontSize: number;
    enterToSend: boolean;
    mediaAutoDownload: boolean;
  };
}

// Trạng thái chung của ứng dụng
export interface AppState {
  isConnected: boolean;
  lastSynced?: string;
  currentScreen?: string;
} 