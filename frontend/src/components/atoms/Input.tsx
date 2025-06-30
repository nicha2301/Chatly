import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  TextInputProps, 
  StyleProp,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  errorStyle?: StyleProp<ViewStyle>;
  touched?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  touched = false,
  secureTextEntry,
  ...props
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const isSecureTextEntry = secureTextEntry && !passwordVisible;
  const hasError = touched && error ? true : false;

  return (
    <View style={containerStyle} className="mb-4">
      {label && (
        <Text 
          className="text-gray-700 mb-1 font-medium"
          style={labelStyle}
        >
          {label}
        </Text>
      )}
      
      <View className={`flex-row items-center border rounded-md overflow-hidden ${hasError ? 'border-error-500' : 'border-gray-300'}`}>
        {leftIcon && (
          <View className="pl-3 pr-1">
            {leftIcon}
          </View>
        )}
        
        <TextInput
          className="flex-1 py-2 px-3 text-gray-800"
          style={inputStyle}
          secureTextEntry={isSecureTextEntry}
          placeholderTextColor="#9ca3af"
          {...props}
        />
        
        {rightIcon && !showPasswordToggle && (
          <View className="pl-1 pr-3">
            {rightIcon}
          </View>
        )}
        
        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity 
            onPress={togglePasswordVisibility}
            className="pr-3 pl-1"
          >
            <Ionicons 
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#6b7280" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {hasError && (
        <Text 
          className="text-error-500 text-xs mt-1"
          style={errorStyle}
        >
          {error}
        </Text>
      )}
    </View>
  );
}; 