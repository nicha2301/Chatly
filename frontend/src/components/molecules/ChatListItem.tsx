import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Conversation, User } from '../../types';
import { StyledText } from '../atoms/StyledText';
import { formatMessageTime } from '../../utils/dateUtils';
import { useTranslation } from '../../i18n';

interface ChatListItemProps {
  conversation: Conversation;
  onPress: () => void;
  currentUserId: string;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  conversation,
  onPress,
  currentUserId,
}) => {
  const { t } = useTranslation();
  
  // Xác định tên hiển thị cho cuộc trò chuyện
  const getDisplayName = (): string => {
    // Kiểm tra conversation.isGroupChat hoặc conversation.isGroup (hỗ trợ cả 2 trường)
    const isGroup = conversation.isGroupChat || conversation.isGroup;
    
    if (isGroup) {
      return conversation.name || t('chat.new_group') || 'New Group';
    } else {
      // Đảm bảo participants tồn tại
      if (!conversation.participants || !Array.isArray(conversation.participants)) {
        return t('chat.unknown_user') || 'Unknown User';
      }
      
      // Tìm người dùng khác trong cuộc trò chuyện 1-1
      const otherParticipant = conversation.participants.find(
        (participant) => participant?.id !== currentUserId
      );
      
      return otherParticipant?.username || otherParticipant?.fullName || t('chat.unknown_user') || 'Unknown User';
    }
  };

  // Xác định avatar hiển thị
  const getAvatarUrl = (): string => {
    const isGroup = conversation.isGroupChat || conversation.isGroup;
    const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=48';
    
    if (isGroup) {
      // Sử dụng avatar nhóm nếu có, hoặc sử dụng mặc định
      return conversation.avatarUrl || defaultAvatar;
    } else {
      // Kiểm tra participants tồn tại
      if (!conversation.participants || !Array.isArray(conversation.participants)) {
        return defaultAvatar;
      }
      
      // Lấy avatar của người dùng khác trong cuộc trò chuyện 1-1
      const otherParticipant = conversation.participants.find(
        (participant) => participant?.id !== currentUserId
      );
      
      return otherParticipant?.avatarUrl || defaultAvatar;
    }
  };

  // Xác định trạng thái online
  const getOnlineStatus = (): boolean => {
    const isGroup = conversation.isGroupChat || conversation.isGroup;
    
    if (isGroup) {
      return false;
    } else {
      // Kiểm tra participants tồn tại
      if (!conversation.participants || !Array.isArray(conversation.participants)) {
        return false;
      }
      
      const otherParticipant = conversation.participants.find(
        (participant) => participant?.id !== currentUserId
      );
      
      return otherParticipant?.isOnline || false;
    }
  };

  // Định dạng nội dung tin nhắn cuối cùng
  const getLastMessageContent = (): string => {
    if (!conversation.lastMessage) {
      return t('chat.no_messages') || 'No messages yet';
    }
    
    // Nếu tin nhắn đã bị xóa
    if (conversation.lastMessage.deleted) {
      return t('chat.message_deleted') || 'Message was deleted';
    }
    
    // Nếu tin nhắn có đính kèm
    if (conversation.lastMessage.attachments && conversation.lastMessage.attachments.length > 0) {
      const attachment = conversation.lastMessage.attachments[0];
      switch (attachment.type) {
        case 'image':
          return '📷 ' + (t('chat.image') || 'Photo');
        case 'video':
          return '🎥 ' + (t('chat.video') || 'Video');
        case 'audio':
          return '🎵 ' + (t('chat.audio') || 'Audio');
        case 'document':
          return '📄 ' + (t('chat.document') || 'Document');
        default:
          return t('chat.attachment') || 'Attachment';
      }
    }
    
    return conversation.lastMessage.content || '';
  };

  // Format thời gian tin nhắn cuối cùng
  const getLastMessageTime = (): string => {
    if (!conversation.lastMessage || !conversation.lastMessage.createdAt) {
      return '';
    }
    
    return formatMessageTime(new Date(conversation.lastMessage.createdAt));
  };

  // Xác định người gửi tin nhắn cuối cùng
  const getLastMessageSender = (): string => {
    const isGroup = conversation.isGroupChat || conversation.isGroup;
    
    if (!conversation.lastMessage || !isGroup) {
      return '';
    }
    
    const sender = conversation.lastMessage.sender || conversation.lastMessage.senderId;
    
    // Nếu người gửi là một chuỗi (ID), tìm trong danh sách người tham gia
    if (typeof sender === 'string') {
      // Kiểm tra participants tồn tại
      if (!conversation.participants || !Array.isArray(conversation.participants)) {
        return '';
      }
      
      const senderUser = conversation.participants.find((p) => p && p.id === sender);
      return senderUser?.username ? `${senderUser.username}: ` : '';
    }
    
    // Nếu người gửi là một object User
    if (sender && typeof sender === 'object' && sender.username) {
      return `${sender.username}: `;
    }
    
    return '';
  };

  try {
    const isOnline = getOnlineStatus();
    const displayName = getDisplayName() || t('chat.unknown_user') || 'Unknown Chat';
    const lastMessageContent = getLastMessageContent();
    const lastMessageTime = getLastMessageTime();
    const lastMessageSender = getLastMessageSender();
    const avatarUrl = getAvatarUrl();
    const hasUnread = (conversation.unreadCount || 0) > 0;

    return (
      <TouchableOpacity 
        onPress={onPress}
        className="px-4 py-3 flex-row items-center"
        activeOpacity={0.7}
      >
        {/* Avatar với trạng thái online */}
        <View className="relative">
          <Image
            source={{ uri: avatarUrl }}
            className="w-14 h-14 rounded-full"
          />
          {isOnline && (
            <View className="absolute right-0 bottom-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>

        {/* Thông tin cuộc trò chuyện */}
        <View className="flex-1 ml-3 border-b border-gray-100 pb-3">
          <View className="flex-row justify-between items-center">
            <StyledText
              variant="body"
              weight="bold"
              color="black"
              numberOfLines={1}
              className="flex-1 pr-2"
            >
              {displayName}
            </StyledText>
            <StyledText
              variant="caption"
              color="gray"
            >
              {lastMessageTime}
            </StyledText>
          </View>

          <View className="flex-row justify-between items-center mt-1">
            <StyledText
              variant="body-sm"
              color={hasUnread ? "primary" : "gray"}
              weight={hasUnread ? "medium" : "regular"}
              numberOfLines={1}
              className="flex-1 pr-2"
            >
              {lastMessageSender}{lastMessageContent}
            </StyledText>
            
            {hasUnread && (
              <View className="bg-primary-500 rounded-full w-6 h-6 flex items-center justify-center">
                <StyledText
                  variant="caption"
                  color="white"
                  weight="bold"
                >
                  {conversation.unreadCount}
                </StyledText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  } catch (error) {
    // Log lỗi và hiển thị item dự phòng nếu có vấn đề
    console.error('Error rendering ChatListItem:', error);
    return (
      <TouchableOpacity 
        onPress={onPress}
        className="px-4 py-3 flex-row items-center"
      >
        <View className="w-14 h-14 rounded-full bg-gray-300" />
        <View className="flex-1 ml-3 border-b border-gray-100 pb-3">
          <StyledText variant="body" color="gray">{t('chat.conversation') || 'Conversation'}</StyledText>
        </View>
      </TouchableOpacity>
    );
  }
}; 