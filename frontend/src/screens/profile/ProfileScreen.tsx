import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { Container } from '../../components/atoms/Container';
import { StyledText } from '../../components/atoms/StyledText';
import { HeaderBar } from '../../components/organisms/HeaderBar';
import { Button } from '../../components/atoms/Button';
import { RootState } from '../../store';
import { useTranslation } from '../../i18n';
import api from '../../services/api';
import { User } from '../../types';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const currentUser = useSelector((state: RootState) => state.user.user);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Lấy ID người dùng từ params
  const { id = '' } = route.params as { id: string };
  
  useEffect(() => {
    // Nếu đang xem profile của chính mình
    if (id === currentUser?.id || !id) {
      setUser(currentUser);
      setIsOwner(true);
      setIsLoading(false);
      return;
    }
    
    // Nếu đang xem profile người khác
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/users/${id}`);
        setUser(response.data);
        setIsOwner(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        Alert.alert(
          t('errors.server_error'),
          t('errors.not_found')
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [id, currentUser]);

  // Phần hiển thị khi đang tải
  if (isLoading) {
    return (
      <Container safeArea>
        <HeaderBar
          title={t('profile.profile')}
          showBackButton
        />
        <View className="flex-1 justify-center items-center">
          <StyledText variant="body" color="gray">
            {t('common.loading')}
          </StyledText>
        </View>
      </Container>
    );
  }

  // Phần hiển thị khi không tìm thấy người dùng
  if (!user) {
    return (
      <Container safeArea>
        <HeaderBar
          title={t('profile.profile')}
          showBackButton
        />
        <View className="flex-1 justify-center items-center">
          <StyledText variant="body" color="gray">
            {t('errors.not_found')}
          </StyledText>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <HeaderBar
        title={isOwner ? t('profile.profile') : user.username}
        showBackButton
        rightActions={isOwner ? [
          {
            icon: 'create-outline',
            onPress: () => {
              // Điều hướng đến màn hình chỉnh sửa profile
            },
          },
        ] : []}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar và thông tin cơ bản */}
        <View className="items-center py-6">
          <Image
            source={{ uri: user.avatarUrl || 'https://via.placeholder.com/150' }}
            className="w-28 h-28 rounded-full"
          />
          
          <StyledText
            variant="h3"
            weight="bold"
            color="black"
            className="mt-4"
          >
            {user.username}
          </StyledText>
          
          {user.fullName && (
            <StyledText
              variant="body"
              color="gray"
              className="mt-1"
            >
              {user.fullName}
            </StyledText>
          )}
          
          <View className="flex-row items-center mt-2">
            <View className={`w-2.5 h-2.5 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <StyledText
              variant="caption"
              color="gray"
              className="ml-1.5"
            >
              {user.isOnline ? t('chat.online') : t('chat.offline')}
            </StyledText>
          </View>
        </View>

        {/* Thông tin người dùng */}
        <View className="px-4 pt-4 pb-6">
          {user.bio && (
            <View className="mb-6">
              <StyledText
                variant="body-sm"
                weight="medium"
                color="gray"
                className="mb-1"
              >
                {t('profile.bio')}
              </StyledText>
              <StyledText
                variant="body"
                color="black"
              >
                {user.bio}
              </StyledText>
            </View>
          )}

          <View className="flex-row">
            {/* Nếu không phải là chủ sở hữu hồ sơ, hiển thị nút nhắn tin */}
            {!isOwner && (
              <Button
                onPress={() => {
                  // Điều hướng đến màn hình chat
                  navigation.navigate('Chat', {
                    id: '',  // Sẽ được điền khi tạo cuộc trò chuyện mới
                    name: user.username,
                  });
                }}
                startIcon={<Ionicons name="chatbubble-outline" size={18} color="white" />}
                fullWidth
              >
                {t('chat.new_message')}
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </Container>
  );
};

export default ProfileScreen; 