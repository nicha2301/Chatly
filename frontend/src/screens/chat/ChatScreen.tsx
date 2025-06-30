import React, { useState, useEffect, useRef, RefObject } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, StackActions } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { Container } from '../../components/atoms/Container';
import { HeaderBar } from '../../components/organisms/HeaderBar';
import { MessageList } from '../../components/organisms/MessageList';
import { MessageInput } from '../../components/organisms/MessageInput';
import { StyledText } from '../../components/atoms/StyledText';
import { useTranslation } from '../../i18n';
import { RootState } from '../../store';
import { setMessages, addMessage } from '../../store/slices/messageSlice';
import { selectConversation } from '../../store/slices/conversationSlice';
import api from '../../services/api';
import socketService from '../../services/socket';
import { Message, Conversation, MessageStatus } from '../../types';

// Dữ liệu mẫu cho tin nhắn
const SAMPLE_MESSAGES: Record<string, Message[]> = {
  '1': [
    {
      id: 'm101',
      conversationId: '1',
      senderId: '2',
      content: 'Hey there! How are you doing?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm102',
      conversationId: '1',
      senderId: '1',
      content: 'Hi! I\'m good, thanks for asking. How about you?',
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm103',
      conversationId: '1',
      senderId: '2',
      content: 'I\'m doing well too. Do you have time to catch up this weekend?',
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm104',
      conversationId: '1',
      senderId: '1',
      content: 'Sure, I\'m free on Saturday afternoon. Would that work for you?',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm105',
      conversationId: '1',
      senderId: '2',
      content: 'Saturday sounds perfect. Let\'s meet at the coffee shop downtown.',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: MessageStatus.READ,
    },
  ],
  '2': [
    {
      id: 'm201',
      conversationId: '2',
      senderId: '3',
      content: 'Team, I\'ve uploaded the new designs to the shared drive.',
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm202',
      conversationId: '2',
      senderId: '4',
      content: 'Thanks, I\'ll take a look at them now.',
      createdAt: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm203',
      conversationId: '2',
      senderId: '1',
      content: 'The new color palette looks great!',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm204',
      conversationId: '2',
      senderId: '3',
      content: 'Let\'s discuss the new UI designs tomorrow',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: MessageStatus.DELIVERED,
    },
  ],
  '3': [
    {
      id: 'm301',
      conversationId: '3',
      senderId: '5',
      content: 'Can you send me those report files?',
      createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm302',
      conversationId: '3',
      senderId: '1',
      content: 'Of course, I\'ll email them to you right away.',
      createdAt: new Date(Date.now() - 1000 * 60 * 290).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm303',
      conversationId: '3',
      senderId: '5',
      content: 'Thanks! I need them for the meeting tomorrow.',
      createdAt: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
      status: MessageStatus.READ,
    },
    {
      id: 'm304',
      conversationId: '3',
      senderId: '1',
      content: 'I sent you the files you asked for',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      status: MessageStatus.READ,
    },
  ],
};

const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation<any>(); // Sử dụng any để tránh lỗi typechecking
  const dispatch = useDispatch();
  const flatListRef = useRef<FlatList<Message>>(null);
  
  const currentUser = useSelector((state: RootState) => state.user.user);
  const messages = useSelector((state: RootState) => {
    const conversation = state.conversations.selectedConversation;
    return conversation ? state.messages.messages[conversation.id] || [] : [];
  });
  const selectedConversation = useSelector((state: RootState) => state.conversations.selectedConversation);
  
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Lấy thông tin cuộc trò chuyện từ params - hỗ trợ cả cấu trúc cũ và mới
  const { id, conversationId, name, title } = route.params as { 
    id?: string; 
    name?: string;
    conversationId?: string; 
    title?: string 
  };
  
  // Sử dụng conversationId nếu có, nếu không dùng id
  const chatId = conversationId || id;
  // Sử dụng title nếu có, nếu không dùng name
  const chatName = title || name;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setApiError(false);
        
        // Nếu đã có conversation ID
        if (chatId) {
          try {
            // Lấy thông tin conversation
            const convResponse = await api.get(`/conversations/${chatId}`);
            const conversation = convResponse.data;
            
            // Lấy tin nhắn
            const msgResponse = await api.get(`/messages/${chatId}`);
            const messages = msgResponse.data;
            
            // Cập nhật store
            dispatch(selectConversation(conversation));
            dispatch(setMessages({ conversationId: chatId, messages }));
          } catch (error) {
            console.error('Error fetching chat data:', error);
            
            // Sử dụng dữ liệu mẫu nếu có lỗi
            if (SAMPLE_MESSAGES[chatId]) {
              setLocalMessages(SAMPLE_MESSAGES[chatId]);
            } else {
              setLocalMessages([]);
            }
            
            setApiError(true);
          }
        } 
        // Nếu chưa có conversation (chat mới)
        else if (chatName) {
          // Hiển thị tên người dùng đã được truyền qua params
          // Khi gửi tin nhắn đầu tiên sẽ tạo conversation mới
          setLocalMessages([]);
        }
        
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Chỉ lắng nghe socket nếu không có lỗi API
    if (!apiError) {
      // Kết nối socket
      socketService.connect();
      
      // Lắng nghe sự kiện tin nhắn mới
      socketService.on('new_message', (message: Message) => {
        if (message.conversationId === chatId) {
          dispatch(addMessage(message));
          scrollToBottom();
        }
      });
      
      // Lắng nghe sự kiện typing
      socketService.on('user_typing', (data: { conversationId: string; username: string }) => {
        if (data.conversationId === chatId && data.username !== currentUser?.username) {
          setIsTyping(true);
          // Tự động tắt sau 3 giây
          setTimeout(() => setIsTyping(false), 3000);
        }
      });
      
      return () => {
        socketService.off('new_message');
        socketService.off('user_typing');
      };
    }
  }, [chatId, dispatch]);
  
  // Cuộn xuống cuối danh sách tin nhắn khi có tin nhắn mới
  const scrollToBottom = () => {
    if (flatListRef.current && (messages.length > 0 || localMessages.length > 0)) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };
  
  // Xử lý gửi tin nhắn
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    if (apiError) {
      // Xử lý gửi tin nhắn khi không có API (chế độ demo)
      const newMessage: Message = {
        id: `demo-${Date.now()}`,
        conversationId: chatId || 'demo',
        senderId: '1', // Giả định ID người dùng hiện tại là 1
        content: text,
        createdAt: new Date().toISOString(),
        status: MessageStatus.SENT,
      };
      
      setLocalMessages(prev => [...prev, newMessage]);
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return;
    }
    
    try {
      setSendingMessage(true);
      
      const messageData = {
        content: text,
        conversationId: chatId || undefined,
        receiverUsername: chatName,
      };
      
      // Gửi tin nhắn đến server
      const response = await api.post('/messages', messageData);
      
      // Nếu là cuộc trò chuyện mới, cập nhật ID và chuyển hướng
      if (!chatId && response.data.conversation) {
        const newConversation = response.data.conversation;
        dispatch(selectConversation(newConversation));
        // Cập nhật params bằng cách điều hướng lại đến cùng màn hình
        navigation.replace('Chat', {
          id: newConversation.id,
          conversationId: newConversation.id,
        });
      }
      
      // Thêm tin nhắn vào store
      dispatch(addMessage(response.data.message));
      scrollToBottom();
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Xử lý đang nhập
  const handleTyping = () => {
    if (!apiError && chatId) {
      socketService.emit('typing', {
        conversationId: chatId,
        username: currentUser?.username,
      });
    }
  };
  
  // Nội dung header bar
  const getHeaderContent = () => {
    if (selectedConversation && !apiError) {
      const otherUser = selectedConversation.participants.find(
        p => p.id !== currentUser?.id
      );
      
      return {
        title: otherUser?.username || t('chat.unknown_user'),
        subtitle: isTyping ? t('chat.typing') : (otherUser?.isOnline ? t('chat.online') : t('chat.offline')),
      };
    }
    
    return { 
      title: chatName || t('chat.conversation') || 'Chat',
      subtitle: apiError ? t('errors.demo_mode') || 'Demo Mode' : undefined
    };
  };
  
  // Tin nhắn hiển thị - ưu tiên localMessages nếu đang ở chế độ demo
  const displayMessages = apiError ? localMessages : messages;
  
  // Hiển thị loading
  if (isLoading) {
    return (
      <Container safeArea>
        <HeaderBar
          showBackButton
          title={chatName || t('chat.conversation') || 'Chat'}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0072ff" />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <HeaderBar
        showBackButton
        title={getHeaderContent().title}
        subtitle={getHeaderContent().subtitle}
      />
      
      {apiError && (
        <View className="bg-yellow-100 dark:bg-yellow-800 px-4 py-2">
          <StyledText variant="caption" color="warning">
            {t('errors.demo_mode') || 'Demo mode - API not available'}
          </StyledText>
        </View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={80}
      >
        <View className="flex-1">
          {displayMessages.length > 0 ? (
            <MessageList
              messages={displayMessages}
              currentUserId={currentUser?.id || '1'} // Fallback to '1' for demo mode
              flatListRef={flatListRef}
            />
          ) : (
            <View className="flex-1 justify-center items-center p-4">
              <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
              <StyledText
                variant="body"
                color="gray"
                align="center"
                className="mt-4"
              >
                {t('chat.no_messages') || 'No messages yet. Start the conversation!'} 
              </StyledText>
            </View>
          )}

          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={sendingMessage}
            placeholder={t('chat.type_message') || 'Type a message...'}
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default ChatScreen; 