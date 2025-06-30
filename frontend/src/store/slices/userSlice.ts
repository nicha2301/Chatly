import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types';
import authService, {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  DEMO_MODE_KEY
} from '../../services/authService';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunk để đăng nhập
export const login = createAsyncThunk(
  'user/login',
  async (credentials: { email: string; password: string; rememberMe?: boolean }, { rejectWithValue }) => {
    try {
      const user = await authService.login(credentials);
      
      // Service đã cập nhật token và user trong AsyncStorage
      return {
        user,
        token: await AsyncStorage.getItem(AUTH_TOKEN_KEY),
        refreshToken: await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

// Async thunk để đăng ký
export const register = createAsyncThunk(
  'user/register',
  async (userData: { email: string; password: string; fullName: string; username?: string }, { rejectWithValue }) => {
    try {
      const user = await authService.register(userData);
      
      // Service đã cập nhật token và user trong AsyncStorage
      return {
        user,
        token: await AsyncStorage.getItem(AUTH_TOKEN_KEY),
        refreshToken: await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đăng ký thất bại');
    }
  }
);

// Async thunk để lấy thông tin người dùng hiện tại
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getCurrentUser();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể lấy thông tin người dùng');
    }
  }
);

// Async thunk để đăng xuất
export const logout = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đăng xuất thất bại');
    }
  }
);

// Async thunk để cập nhật thông tin người dùng
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', userData);
      
      // Cập nhật thông tin trong AsyncStorage
      const user = response.data;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể cập nhật thông tin người dùng');
    }
  }
);

// Async thunk để làm mới token
export const refreshUserToken = createAsyncThunk(
  'user/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const newToken = await authService.refreshToken();
      
      if (!newToken) {
        throw new Error('Không thể làm mới token');
      }
      
      return newToken;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không thể làm mới token');
    }
  }
);

// Async thunk để kiểm tra trạng thái xác thực
export const checkAuthStatus = createAsyncThunk(
  'user/checkAuthStatus',
  async (_, { dispatch }) => {
    try {
      const isAuthenticated = await authService.checkAuth();
      
      if (isAuthenticated) {
        dispatch(fetchCurrentUser());
      }
      
      return isAuthenticated;
    } catch (error) {
      return false;
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    startLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    stopLoading: (state) => {
      state.isLoading = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateAvatar: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.avatarUrl = action.payload;
      }
    },
    updateUserInfo: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logoutUser: (state) => {
      // Reset state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch current user
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.user = action.payload;
        state.isAuthenticated = true;
      }
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Update profile
    builder.addCase(updateUserProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Refresh token
    builder.addCase(refreshUserToken.fulfilled, (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(refreshUserToken.rejected, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    });
    
    // Check auth status
    builder.addCase(checkAuthStatus.fulfilled, (state, action) => {
      if (!action.payload) {
        state.isLoading = false;
      }
    });
  },
});

export const {
  setToken,
  setUser,
  startLoading,
  stopLoading,
  setError,
  updateAvatar,
  updateUserInfo,
  logoutUser,
} = userSlice.actions;

export default userSlice.reducer; 