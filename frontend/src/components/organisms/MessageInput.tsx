import React, { useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleProp, 
  ViewStyle,
  Keyboard,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  onAttachmentPress?: () => void;
  enableAttachments?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Nhập tin nhắn...',
  containerStyle,
  onAttachmentPress,
  enableAttachments = true,
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      if (Platform.OS === 'ios') {
        inputRef.current?.blur();
      }
    }
  };

  return (
    <View 
      className="border-t border-gray-200 p-2 bg-white flex-row items-center"
      style={containerStyle}
    >
      {enableAttachments && (
        <TouchableOpacity 
          className="mr-2 p-2"
          onPress={onAttachmentPress}
          disabled={isLoading}
        >
          <Ionicons name="attach" size={24} color="#6b7280" />
        </TouchableOpacity>
      )}
      
      <TextInput
        ref={inputRef}
        className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-800"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={1000}
      />
      
      <TouchableOpacity 
        className={`ml-2 p-2 rounded-full ${
          message.trim() && !isLoading ? 'bg-primary-500' : 'bg-gray-300'
        }`}
        onPress={handleSend}
        disabled={!message.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons 
            name="send" 
            size={20} 
            color={message.trim() ? '#ffffff' : '#9ca3af'} 
          />
        )}
      </TouchableOpacity>
    </View>
  );
}; 