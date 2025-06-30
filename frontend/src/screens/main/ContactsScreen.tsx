import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Container } from '../../components/atoms/Container';
import { StyledText } from '../../components/atoms/StyledText';
import { UserListItem } from '../../components/molecules/UserListItem';
import { HeaderBar } from '../../components/organisms/HeaderBar';
import { useTranslation } from '../../i18n';
import { User } from '../../types';
import { RootState } from '../../store';
import api from '../../services/api';

// Dữ liệu mẫu cho danh bạ - sử dụng khi API không có sẵn
const SAMPLE_CONTACTS: User[] = [
  {
    id: '1',
    username: 'johndoe',
    fullName: 'John Doe',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    status: 'Available',
    isOnline: true,
  },
  {
    id: '2',
    username: 'janedoe',
    fullName: 'Jane Doe',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'Busy',
    isOnline: true,
  },
  {
    id: '3',
    username: 'robertsmith',
    fullName: 'Robert Smith',
    avatarUrl: 'https://randomuser.me/api/portraits/men/42.jpg',
    status: 'Away',
    isOnline: false,
    lastSeen: new Date().toISOString(),
  },
  {
    id: '4',
    username: 'emilywilson',
    fullName: 'Emily Wilson',
    avatarUrl: 'https://randomuser.me/api/portraits/women/26.jpg',
    status: 'In a meeting',
    isOnline: false,
    lastSeen: new Date().toISOString(),
  },
  {
    id: '5',
    username: 'michaelbrown',
    fullName: 'Michael Brown',
    avatarUrl: 'https://randomuser.me/api/portraits/men/81.jpg',
    status: 'Available',
    isOnline: true,
  },
];

const ContactsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const currentUser = useSelector((state: RootState) => state.user.user);
  
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Lấy danh sách liên hệ
  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setApiError(false);
      
      try {
        // Sử dụng timeout để tránh gọi API nhiều lần nếu biết nó sẽ thất bại
        const savedErrorTime = await AsyncStorage.getItem('contacts_api_error_time');
        const currentTime = Date.now();
        
        // Nếu đã có lỗi API trong vòng 5 phút, không gọi lại API
        if (savedErrorTime && (currentTime - Number(savedErrorTime)) < 5 * 60 * 1000) {
          throw new Error('Recent API failure');
        }
        
        const response = await api.get('/users/contacts');
        setContacts(response.data);
      } catch (error: any) {
        // Lưu thời gian lỗi API
        await AsyncStorage.setItem('contacts_api_error_time', Date.now().toString());
        
        // Không hiển thị lỗi trong console nếu là lỗi 404 vì đây là tính năng dự kiến
        if (!error.message.includes('Recent API failure')) {
          console.log('Using demo contacts data'); // Thông báo nhẹ nhàng hơn
        }
        
        // Sử dụng dữ liệu mẫu khi có lỗi API
        setContacts(SAMPLE_CONTACTS);
        setApiError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Làm mới danh sách liên hệ
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  };

  // Lọc liên hệ theo tên
  const filteredContacts = searchQuery
    ? contacts.filter(contact => {
        const fullName = contact.fullName?.toLowerCase() || '';
        const username = contact.username.toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || username.includes(query);
      })
    : contacts;

  // Xử lý khi chọn một liên hệ
  const handleContactPress = (contact: User) => {
    if (apiError) {
      // Nếu đang dùng dữ liệu mẫu, chỉ hiển thị thông báo
      alert(t('errors.demo_mode') || 'This is a demo. API connection not available.');
      return;
    }
    
    // Kiểm tra xem đã có cuộc trò chuyện với người này chưa
    try {
      // Mô phỏng chuyển đến màn hình chat
      navigation.navigate('Chat', {
        conversationId: `demo-${contact.id}`,
        title: contact.fullName || contact.username,
      });
    } catch (error) {
      console.error('Error navigating to chat:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchContacts();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Container safeArea>
      <HeaderBar
        title={t('contacts.contacts')}
        rightActions={[
          {
            icon: 'person-add-outline',
            onPress: () => {
              // Điều hướng đến màn hình thêm liên hệ
              alert(t('common.comingSoon') || 'Coming soon!');
            },
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
            placeholder={t('contacts.search') || 'Search contacts'}
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

      {/* Danh sách liên hệ */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0072ff" />
        </View>
      ) : filteredContacts.length > 0 ? (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserListItem
              user={item}
              onPress={() => handleContactPress(item)}
            />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="people-outline" size={64} color="#9ca3af" />
          <StyledText
            variant="h4"
            weight="bold"
            color="gray"
            className="mt-4"
          >
            {t('contacts.no_contacts') || 'No Contacts Found'}
          </StyledText>
          <StyledText
            variant="body"
            color="gray"
            align="center"
            className="mt-2 mb-6"
          >
            {t('contacts.invite_friends') || 'Invite your friends to Chatly to start chatting'}
          </StyledText>
          <TouchableOpacity
            className="bg-primary-500 py-3 px-6 rounded-full"
            onPress={() => {
              // Điều hướng đến màn hình mời bạn bè
              alert(t('common.comingSoon') || 'Coming soon!');
            }}
          >
            <StyledText
              variant="body"
              weight="medium" 
              color="white"
            >
              {t('contacts.add_contact') || 'Add Contact'}
            </StyledText>
          </TouchableOpacity>
        </View>
      )}
    </Container>
  );
};

export default ContactsScreen; 