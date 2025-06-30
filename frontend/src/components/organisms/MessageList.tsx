import React, { useEffect, useRef } from 'react';
import { View, FlatList, ListRenderItemInfo } from 'react-native';
import { Message } from '../../types';
import { StyledText } from '../atoms/StyledText';
import { formatMessageTime, getRelativeTime } from '../../utils/dateUtils';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwnMessage }) => {
  const messageTime = new Date(message.createdAt);
  
  return (
    <View
      className={`mb-2 px-2 max-w-[85%] ${
        isOwnMessage ? 'self-end' : 'self-start'
      }`}
    >
      <View
        className={`px-4 py-2 rounded-2xl ${
          isOwnMessage
            ? 'bg-blue-500 rounded-tr-none'
            : 'bg-gray-200 dark:bg-gray-700 rounded-tl-none'
        }`}
      >
        <StyledText
          variant="body"
          color={isOwnMessage ? 'white' : 'black'}
        >
          {message.content}
        </StyledText>
      </View>

      <StyledText
        variant="caption"
        color="gray"
        className={`mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}
      >
        {formatMessageTime(messageTime)}
      </StyledText>
    </View>
  );
};

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  flatListRef: React.RefObject<FlatList<Message> | null>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  flatListRef,
}) => {
  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages.length]);

  const renderItem = ({ item }: ListRenderItemInfo<Message>) => {
    const isOwnMessage = item.senderId === currentUserId;
    return <MessageItem message={item} isOwnMessage={isOwnMessage} />;
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 10 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export { MessageList }; 