import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  TouchableOpacityProps, 
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  disabled = false,
  ...props
}) => {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary-500 border-primary-500',
    secondary: 'bg-secondary-500 border-secondary-500',
    outline: 'bg-transparent border-primary-500',
    ghost: 'bg-transparent border-transparent',
    link: 'bg-transparent border-transparent',
  };

  const textColorClasses: Record<ButtonVariant, string> = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary-500',
    ghost: 'text-primary-500',
    link: 'text-primary-500',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'py-1 px-3',
    md: 'py-2 px-4',
    lg: 'py-3 px-6',
  };

  const textSizeClasses: Record<ButtonSize, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const disabledClasses = disabled 
    ? 'opacity-50' 
    : '';

  const variantClass = variantClasses[variant];
  const textColorClass = textColorClasses[variant];
  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <TouchableOpacity
      className={`rounded-md border ${variantClass} ${sizeClass} ${widthClass} ${disabledClasses} items-center justify-center flex-row`}
      disabled={disabled || isLoading}
      style={style}
      {...props}
    >
      {isLoading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'secondary' ? 'white' : '#0072ff'} 
          className="mr-2"
        />
      )}
      
      {!isLoading && leftIcon && (
        <View className="mr-2">{leftIcon}</View>
      )}
      
      <Text className={`font-medium ${textColorClass} ${textSizeClass}`} style={textStyle}>
        {children}
      </Text>
      
      {!isLoading && rightIcon && (
        <View className="ml-2">{rightIcon}</View>
      )}
    </TouchableOpacity>
  );
}; 