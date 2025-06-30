import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../store';
import { setToken, setUser, stopLoading } from '../store/slices/userSlice';
import { useTranslation } from '../i18n';

// Màn hình xác thực
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Màn hình chính
import ChatListScreen from '../screens/main/ChatListScreen';
import ContactsScreen from '../screens/main/ContactsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Màn hình chat và hồ sơ
import ChatScreen from '../screens/chat/ChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Định nghĩa các kiểu dữ liệu cho navigation
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { conversationId?: string; id?: string; title?: string };
  Profile: { userId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Contacts: undefined;
  Settings: undefined;
};

// Tùy chỉnh theme cho Navigation
const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0072ff',
    background: '#ffffff',
    card: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
  },
};

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#0072ff',
    background: '#121212',
    card: '#1e1e1e',
    text: '#f3f4f6',
    border: '#374151',
  },
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Cấu hình Stack điều hướng xác thực
const AuthNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <AuthStack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
      />
    </AuthStack.Navigator>
  );
};

// Cấu hình Tab điều hướng chính
const MainNavigator = () => {
  const { t } = useTranslation();
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const insets = useSafeAreaInsets();
  
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          
          if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Contacts') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'alert-circle-outline';
          }
          
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0072ff',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
          backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#ffffff',
          paddingBottom: Math.max(insets.bottom, 5), // Đảm bảo padding dưới trên iPhone có notch
          paddingTop: 8,
          height: Math.max(60, insets.bottom + 50), // Điều chỉnh chiều cao dựa trên insets
          elevation: 8, // Android shadow
          shadowColor: '#000000', // iOS shadow
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          paddingBottom: 5,
        },
      })}
    >
      <MainTab.Screen 
        name="Chats" 
        component={ChatListScreen} 
        options={{ title: t('chat.conversations') || 'Chats' }}
      />
      <MainTab.Screen 
        name="Contacts" 
        component={ContactsScreen} 
        options={{ title: t('contacts.contacts') || 'Contacts' }}
      />
      <MainTab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: t('settings.settings') || 'Settings' }}
      />
    </MainTab.Navigator>
  );
};

// Điều hướng chính
const AppNavigation = () => {
  const { isLoading, isAuthenticated, token } = useSelector((state: RootState) => state.user);
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const dispatch = useDispatch();
  
  // Kiểm tra token khi ứng dụng khởi động
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          dispatch(setToken(storedToken));
          dispatch(setUser(JSON.parse(storedUser)));
        } else {
          // Nếu không có token, đảm bảo isLoading vẫn được đặt thành false
          dispatch(stopLoading());
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra token:', error);
        // Trong trường hợp lỗi, cũng đảm bảo isLoading được đặt thành false
        dispatch(stopLoading());
      }
    };
    
    checkToken();
  }, [dispatch]);
  
  // Hiển thị màn hình loading nếu đang tải
  if (isLoading) {
    return <SplashScreen />;
  }
  
  // Chọn theme dựa vào colorScheme
  const theme = colorScheme === 'dark' ? customDarkTheme : customLightTheme;
  
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={theme}>
        <RootStack.Navigator 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff' },
            animation: Platform.OS === 'ios' ? 'simple_push' : 'slide_from_right',
            animationDuration: 200,
            gestureEnabled: true, // Cho phép vuốt để quay lại màn hình trước
            gestureDirection: 'horizontal',
          }}
        >
          {!isAuthenticated ? (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              <RootStack.Screen name="Main" component={MainNavigator} />
              <RootStack.Screen 
                name="Chat" 
                component={ChatScreen} 
                options={{ 
                  animation: 'slide_from_right',
                  gestureEnabled: true, // Cho phép vuốt để quay lại
                  presentation: 'card',
                }}
              />
              <RootStack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ 
                  animation: 'slide_from_right',
                  gestureEnabled: true,
                }}
              />
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigation; 