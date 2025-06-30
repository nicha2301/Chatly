import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation } from '../../types';

interface ConversationsState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ConversationsState = {
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  error: null,
};

const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations = [action.payload, ...state.conversations];
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      const index = state.conversations.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = action.payload;
      }
      if (state.selectedConversation?.id === action.payload.id) {
        state.selectedConversation = action.payload;
      }
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      if (state.selectedConversation?.id === action.payload) {
        state.selectedConversation = null;
      }
    },
    selectConversation: (state, action: PayloadAction<Conversation>) => {
      state.selectedConversation = action.payload;
    },
    clearSelectedConversation: (state) => {
      state.selectedConversation = null;
    },
    startLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  setConversations,
  addConversation,
  updateConversation,
  removeConversation,
  selectConversation,
  clearSelectedConversation,
  startLoading,
  setError,
} = conversationSlice.actions;

export default conversationSlice.reducer;
