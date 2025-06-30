import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Container } from '../../components/atoms/Container';
import { StyledText } from '../../components/atoms/StyledText';
import { ChatListItem } from '../../components/molecules/ChatListItem';
import { HeaderBar } from '../../components/organisms/HeaderBar';
import { useTranslation } from '../../i18n';
import { Conversation, Message, MessageStatus, User } from '../../types';
import { RootState } from '../../store';
import api from '../../services/api';

// Dữ liệu mẫu cho danh sách chat
const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    isGroup: false,
    name: 'John Doe',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    lastMessage: {
      id: 'm1',
      conversationId: '1',
      senderId: '2',
      content: 'Hi there! How are you doing today?',
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
    participants: [
      {
        id: '1',
        username: 'me',
        fullName: 'Current User',
      },
      {
        id: '2',
        username: 'johndoe',
        fullName: 'John Doe',
        avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
        isOnline: true,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    unreadCount: 0,
  },
  {
    id: '2',
    isGroup: true,
    name: 'Design Team',
    avatarUrl: 'https://ui-avatars.com/api/?name=Design+Team&background=0D8ABC&color=fff',
    lastMessage: {
      id: 'm2',
      conversationId: '2',
      senderId: '3',
      content: 'Let\'s discuss the new UI designs tomorrow',
      status: MessageStatus.DELIVERED,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    participants: [
      {
        id: '1',
        username: 'me',
        fullName: 'Current User',
      },
      {
        id: '3',
        username: 'janedoe',
        fullName: 'Jane Doe',
        avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      {
        id: '4', 
        username: 'mikebrown',
        fullName: 'Mike Brown',
        avatarUrl: 'https://randomuser.me/api/portraits/men/81.jpg',
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    unreadCount: 2,
  },
  {
    id: '3',
    isGroup: false,
    name: 'Emily Wilson',
    avatarUrl: 'https://randomuser.me/api/portraits/women/26.jpg',
    lastMessage: {
      id: 'm3',
      conversationId: '3',
      senderId: '1',
      content: 'I sent you the files you asked for',
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    participants: [
      {
        id: '1',
        username: 'me',
        fullName: 'Current User',
      },
      {
        id: '5',
        username: 'emilywilson',
        fullName: 'Emily Wilson',
        avatarUrl: 'https://randomuser.me/api/portraits/women/26.jpg',
        isOnline: false,
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    unreadCount: 0,
  }
];

const ChatListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Lấy danh sách cuộc trò chuyện
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setApiError(false);
      
      try {
        // Sử dụng timeout để tránh gọi API nhiều lần nếu biết nó sẽ thất bại
        const savedErrorTime = await AsyncStorage.getItem('conversations_api_error_time');
        const currentTime = Date.now();
        
        // Nếu đã có lỗi API trong vòng 5 phút, không gọi lại API
        if (savedErrorTime && (currentTime - Number(savedErrorTime)) < 5 * 60 * 1000) {
          throw new Error('Recent API failure');
        }
        
        const response = await api.get('/conversations');
        setConversations(response.data);
      } catch (error: any) {
        // Lưu thời gian lỗi API
        await AsyncStorage.setItem('conversations_api_error_time', Date.now().toString());
        
        // Không hiển thị lỗi trong console nếu là lỗi 404 vì đây là tính năng dự kiến
        if (!error.message.includes('Recent API failure')) {
          console.log('Using demo conversations data'); // Thông báo nhẹ nhàng hơn
        }
        
        // Sử dụng dữ liệu mẫu khi có lỗi API
        setConversations(SAMPLE_CONVERSATIONS);
        setApiError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy lại dữ liệu khi kéo xuống làm mới
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  // Lọc cuộc trò chuyện theo tên
  const filteredConversations = React.useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) {
      return [];
    }
    
    if (!searchQuery) {
      return conversations;
    }

    return conversations.filter(conversation => {
      // Kiểm tra thuộc tính isGroup thay vì isGroupChat để phù hợp với kiểu dữ liệu mẫu
      const isGroup = conversation.isGroup || conversation.isGroupChat;
      const conversationName = isGroup
        ? conversation.name
        : conversation.participants?.find(p => p?.id !== user?.id)?.username;
      
      return conversationName?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, conversations, user]);

  // Xử lý khi nhấn vào cuộc trò chuyện
  const handleConversationPress = (conversation: Conversation) => {
    // Kiểm tra thuộc tính isGroup thay vì isGroupChat để phù hợp với kiểu dữ liệu mẫu
    const isGroup = conversation.isGroup || conversation.isGroupChat;
    let name = conversation.name;
    
    // Nếu không phải nhóm chat, hiển thị tên người dùng khác
    if (!isGroup) {
      const otherParticipant = conversation.participants?.find(p => p.id !== user?.id);
      name = otherParticipant?.fullName || otherParticipant?.username || name;
    }
    
    if (apiError) {
      // Điều hướng với demo data
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        title: name,
      });
    } else {
      navigation.navigate('Chat', {
        id: conversation.id,
        name: name,
        isGroupChat: isGroup,
      });
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Lắng nghe các sự kiện mới (tin nhắn, cuộc trò chuyện mới)
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Container safeArea>
      <HeaderBar
        title={t('chat.conversations') || 'Conversations'}
        rightActions={[
          {
            icon: 'create-outline',
            onPress: () => navigation.navigate('Contacts'),
          },
        ]}
      />

      {apiError && (
        <View className="bg-yellow-100 dark:bg-yellow-800 p-2 mx-4 rounded-md mb-2">
          <StyledText variant="caption" color={apiError ? "warning" : "default"}>
            {t('errors.demo_mode') || 'Using demo data - API not available'}
          </StyledText>
        </View>
      )}

      {/* Ô tìm kiếm */}
      <View className="px-4 mb-2">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder={t('chat.search_conversations') || 'Search conversations'}
            placeholderTextColor="#9ca3af"
            className="ml-2 flex-1 text-gray-800 dark:text-gray-200"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Danh sách cuộc trò chuyện */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0072ff" />
        </View>
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              conversation={item}
              onPress={() => handleConversationPress(item)}
              currentUserId={user?.id || '1'} // Fallback to '1' for demo data
            />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="chatbubbles-outline" size={64} color="#9ca3af" />
          <StyledText
            variant="h4"
            weight="bold"
            color="gray"
            className="mt-4"
          >
            {t('chat.no_conversations') || 'No Conversations Yet'}
          </StyledText>
          <StyledText
            variant="body"
            color="gray"
            align="center"
            className="mt-2 mb-6"
          >
            {t('chat.start_conversation') || 'Start chatting with your friends and family'}
          </StyledText>
          <TouchableOpacity
            className="bg-primary-500 py-3 px-6 rounded-full"
            onPress={() => navigation.navigate('Contacts')}
          >
            <StyledText
              variant="body"
              weight="medium" 
              color="white"
            >
              {t('chat.new_message') || 'New Message'}
            </StyledText>
          </TouchableOpacity>
        </View>
      )}
    </Container>
  );
};

export default ChatListScreen; 