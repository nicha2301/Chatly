import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Input } from '../atoms/Input';
import { Controller, Control, Path, FieldValues, FieldError } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: FieldError;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  errorStyle?: StyleProp<ViewStyle>;
  touched?: boolean;
}

export const FormField = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  secureTextEntry,
  showPasswordToggle,
  keyboardType = 'default',
  leftIcon,
  rightIcon,
  autoCapitalize = 'none',
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  touched = false,
}: FormFieldProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          label={label}
          placeholder={placeholder}
          onChangeText={onChange}
          onBlur={onBlur}
          value={value}
          secureTextEntry={secureTextEntry}
          showPasswordToggle={showPasswordToggle}
          keyboardType={keyboardType}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          autoCapitalize={autoCapitalize}
          error={error?.message}
          containerStyle={containerStyle}
          labelStyle={labelStyle}
          inputStyle={inputStyle}
          errorStyle={errorStyle}
          touched={touched}
        />
      )}
    />
  );
}; 