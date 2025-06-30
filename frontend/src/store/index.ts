import { configureStore } from '@reduxjs/toolkit';
import { ThunkAction, Action } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import themeReducer from './slices/themeSlice';
import conversationReducer from './slices/conversationSlice';
import messageReducer from './slices/messageSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    theme: themeReducer,
    conversations: conversationReducer,
    messages: messageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>; 