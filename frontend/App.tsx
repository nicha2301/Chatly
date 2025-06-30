import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { useColorScheme } from 'nativewind';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/components/atoms/ThemeProvider';
import AppNavigation from './src/navigation';
import { store } from './src/store';
import authService, { DEMO_MODE_KEY } from './src/services/authService';
import SessionExpiryAlert from './src/components/molecules/SessionExpiryAlert';
import './global.css';

// Keep the splash screen visible while we initialize
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore error
  // Sometimes SplashScreen has already been hidden
});

const AppContent = () => {
  const { colorScheme } = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // Ví dụ: Tải fonts
        // await Font.loadAsync({
        //   'poppins-regular': require('./assets/fonts/Poppins-Regular.ttf'),
        //   'poppins-medium': require('./assets/fonts/Poppins-Medium.ttf'),
        // });

        // Kiểm tra trạng thái đăng nhập
        await authService.checkAuth();
        
        // Truy cập AsyncStorage để lấy theme và ngôn ngữ
        await Promise.all([
          AsyncStorage.getItem('theme'),
          AsyncStorage.getItem('chatly_language')
        ]);
        
        // Kích hoạt chế độ demo nếu đã được thiết lập trước đó
        const demoMode = await AsyncStorage.getItem(DEMO_MODE_KEY);
        if (demoMode === 'true') {
          await authService.enableDemoMode(true);
        }

        // Thêm một độ trễ nhỏ để đảm bảo animation splash screen hiển thị mượt mà
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        // Đánh dấu ứng dụng đã sẵn sàng
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        // Ẩn splash screen sau khi app đã sẵn sàng
        await SplashScreen.hideAsync();
      } catch (error) {
        console.log('Error hiding splash screen:', error);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff'
      }} 
      onLayout={onLayoutRootView}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppNavigation />
      <SessionExpiryAlert position="bottom" />
    </View>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <AppContent />
          </SafeAreaProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </Provider>
  );
};

export default App;
