import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';
import { StyledText } from '../atoms/StyledText';
import { getRelativeTime } from '../../utils/dateUtils';

interface UserListItemProps {
  user: User;
  onPress: () => void;
  showStatus?: boolean;
  showLastSeen?: boolean;
  showActions?: boolean;
  onActionPress?: () => void;
  actionIcon?: string;
}

export const UserListItem: React.FC<UserListItemProps> = ({
  user,
  onPress,
  showStatus = true,
  showLastSeen = false,
  showActions = false,
  onActionPress,
  actionIcon = 'ellipsis-vertical',
}) => {
  // Lấy thời gian truy cập cuối nếu có
  const getLastSeenText = () => {
    if (!user.lastSeen || !showLastSeen) return null;
    
    // Nếu đang online thì không hiển thị last seen
    if (user.isOnline) return null;
    
    const lastSeen = typeof user.lastSeen === 'string' 
      ? new Date(user.lastSeen)
      : user.lastSeen;
      
    return getRelativeTime(lastSeen);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-4 py-3 flex-row items-center"
      activeOpacity={0.7}
    >
      {/* Avatar với trạng thái online */}
      <View className="relative">
        <Image
          source={{ 
            uri: user.avatarUrl || 'https://via.placeholder.com/48'
          }}
          className="w-12 h-12 rounded-full"
        />
        {showStatus && user.isOnline && (
          <View className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>

      {/* Thông tin người dùng */}
      <View className="flex-1 ml-3 border-b border-gray-100 pb-3">
        <View className="flex-row justify-between items-center">
          <View>
            <StyledText
              variant="body"
              weight="medium"
              color="black"
            >
              {user.username}
            </StyledText>
            
            {user.fullName && (
              <StyledText
                variant="caption"
                color="gray"
                className="mt-0.5"
              >
                {user.fullName}
              </StyledText>
            )}
          </View>

          {showLastSeen && getLastSeenText() && (
            <StyledText
              variant="caption"
              color="gray"
            >
              {getLastSeenText()}
            </StyledText>
          )}

          {showStatus && (
            <StyledText
              variant="caption"
              color={user.isOnline ? "green" : "gray"}
              className="ml-auto"
            >
              {user.isOnline ? 'Online' : ''}
            </StyledText>
          )}
          
          {showActions && (
            <TouchableOpacity 
              onPress={onActionPress}
              className="ml-2 p-1"
            >
              <Ionicons name={actionIcon as any} size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
        
        {user.bio && (
          <StyledText
            variant="caption"
            color="gray"
            numberOfLines={1}
            className="mt-1"
          >
            {user.bio}
          </StyledText>
        )}
      </View>
    </TouchableOpacity>
  );
}; 