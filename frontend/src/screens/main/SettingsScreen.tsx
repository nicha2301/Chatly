import React from 'react';
import { View, TouchableOpacity, Switch, Alert, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Container } from '../../components/atoms/Container';
import { StyledText } from '../../components/atoms/StyledText';
import { HeaderBar } from '../../components/organisms/HeaderBar';
import { ThemeToggle } from '../../components/molecules/ThemeToggle';
import { LanguageSelector } from '../../components/molecules/LanguageSelector';
import { useTranslation } from '../../i18n';
import { RootState } from '../../store';
import { logoutUser } from '../../store/slices/userSlice';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  
  // Tạo các phần của màn hình cài đặt
  const settingSections = [
    {
      title: t('settings.account'),
      items: [
        {
          icon: 'person-outline',
          label: t('profile.profile'),
          onPress: () => navigation.navigate('Profile', { id: user?.id || '' }),
        },
        {
          icon: 'notifications-outline',
          label: t('settings.notifications'),
          onPress: () => {},
        },
        {
          icon: 'lock-closed-outline',
          label: t('settings.privacy'),
          onPress: () => {},
        },
        {
          icon: 'shield-outline',
          label: t('settings.security'),
          onPress: () => {},
        },
      ],
    },
    {
      title: t('settings.appearance'),
      items: [
        {
          icon: 'moon-outline',
          label: t('settings.theme'),
          component: () => <ThemeToggle />,
        },
        {
          icon: 'language-outline',
          label: t('settings.language'),
          component: () => <LanguageSelector />,
        },
      ],
    },
    {
      title: t('settings.help'),
      items: [
        {
          icon: 'help-circle-outline',
          label: t('settings.help'),
          onPress: () => {},
        },
        {
          icon: 'information-circle-outline',
          label: t('settings.about'),
          onPress: () => {},
        },
      ],
    },
  ];

  // Xử lý đăng xuất
  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('settings.logout_confirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('refresh_token');
              await AsyncStorage.removeItem('user');
              dispatch(logoutUser());
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <Container safeArea>
      <HeaderBar title={t('settings.settings')} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile section */}
        <TouchableOpacity
          className="px-4 py-4 flex-row items-center"
          onPress={() => navigation.navigate('Profile', { id: user?.id || '' })}
        >
          <Image
            source={{ uri: user?.avatarUrl || 'https://via.placeholder.com/100' }}
            className="w-16 h-16 rounded-full"
          />
          <View className="ml-4 flex-1">
            <StyledText variant="body" weight="bold" color="black">
              {user?.username || ''}
            </StyledText>
            {user?.fullName && (
              <StyledText variant="body-sm" color="gray">
                {user.fullName}
              </StyledText>
            )}
            <StyledText variant="caption" color="primary" className="mt-1">
              {t('profile.edit_profile')}
            </StyledText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <View className="h-2 bg-gray-100 dark:bg-gray-800" />

        {/* Settings sections */}
        {settingSections.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`}>
            <View className="px-4 py-2">
              <StyledText variant="body-sm" weight="medium" color="gray">
                {section.title}
              </StyledText>
            </View>

            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={`item-${sectionIndex}-${itemIndex}`}
                className="px-4 py-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700"
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <View className="flex-row items-center">
                  <Ionicons name={item.icon as any} size={22} color="#6b7280" />
                  <StyledText variant="body" color="black" className="ml-3">
                    {item.label}
                  </StyledText>
                </View>
                
                {item.component ? (
                  item.component()
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                )}
              </TouchableOpacity>
            ))}

            <View className="h-2 bg-gray-100 dark:bg-gray-800" />
          </View>
        ))}

        {/* Logout button */}
        <TouchableOpacity
          className="px-4 py-4 flex-row items-center"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <StyledText variant="body" color="error" className="ml-3">
            {t('auth.logout')}
          </StyledText>
        </TouchableOpacity>

        {/* App version */}
        <View className="py-5 items-center">
          <StyledText variant="caption" color="gray">
            Chatly v1.0.0
          </StyledText>
        </View>
      </ScrollView>
    </Container>
  );
};

export default SettingsScreen; 