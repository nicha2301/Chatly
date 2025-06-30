import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../store';
import { updateColorScheme, initTheme } from '../../store/slices/themeSlice';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { theme, colorScheme } = useSelector((state: RootState) => state.theme);
  const deviceColorScheme = useColorScheme();
  
  // Kiểm tra chế độ hệ thống và cập nhật colorScheme
  useEffect(() => {
    if (deviceColorScheme) {
      dispatch(updateColorScheme(deviceColorScheme));
    }
  }, [deviceColorScheme, dispatch]);
  
  // Tải theme từ AsyncStorage khi component mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        dispatch(initTheme(savedTheme));
      } catch (error) {
        console.error('Error loading theme from storage:', error);
      }
    };
    
    loadTheme();
  }, [dispatch]);
  
  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
}; 