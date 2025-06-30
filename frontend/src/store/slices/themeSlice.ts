import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const defaultTheme = 'system';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'light' | 'dark';
  isLoading: boolean;
}

const initialState: ThemeState = {
  theme: defaultTheme as 'light' | 'dark' | 'system',
  colorScheme: Appearance.getColorScheme() || 'light',
  isLoading: true,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      const newTheme = action.payload;
      state.theme = newTheme;
      
      // Lưu theme vào AsyncStorage
      AsyncStorage.setItem('theme', newTheme);
      
      // Cập nhật colorScheme
      if (newTheme === 'system') {
        state.colorScheme = Appearance.getColorScheme() || 'light';
      } else {
        state.colorScheme = newTheme;
      }
    },
    
    updateColorScheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      // Chỉ cập nhật colorScheme nếu đang ở chế độ system
      if (state.theme === 'system') {
        state.colorScheme = action.payload;
      }
    },
    
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    initTheme: (state, action: PayloadAction<string | null>) => {
      const savedTheme = action.payload;
      
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        state.theme = savedTheme as 'light' | 'dark' | 'system';
        
        if (savedTheme === 'system') {
          state.colorScheme = Appearance.getColorScheme() || 'light';
        } else {
          state.colorScheme = savedTheme as 'light' | 'dark';
        }
      }
      
      state.isLoading = false;
    },
  },
});

export const { setTheme, updateColorScheme, setIsLoading, initTheme } = themeSlice.actions;

export default themeSlice.reducer;
