import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSelector } from 'react-redux';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthStackParamList } from '../../navigation';
import { Container } from '../../components/atoms/Container';
import { Input } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { StyledText } from '../../components/atoms/StyledText';
import { useTranslation } from '../../i18n';
import { RootState } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { DemoModeNotice } from '../../components/molecules/DemoModeNotice';

// Schema validation
const schema = yup.object().shape({
  email: yup.string().email('auth.invalid_email').required('auth.email_required'),
});

type FormData = {
  email: string;
};

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const isDarkMode = colorScheme === 'dark';
  
  const { isLoading, error, forgotPassword, clearError } = useAuth();
  const [success, setSuccess] = useState(false);
  
  // Xóa lỗi khi unmount
  useEffect(() => {
    return () => {
      if (error) {
        clearError();
      }
    };
  }, [error, clearError]);
  
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      // Gọi forgotPassword từ hook useAuth
      const result = await forgotPassword(data.email);
      
      if (result) {
        // Đã gửi email thành công
        setSuccess(true);
        setTimeout(() => {
          navigation.goBack();
        }, 3000);
      }
    } catch (error: any) {
      // Error đã được xử lý trong useAuth hook
      console.log('Forgot password error:', error.message);
    }
  };
  
  return (
    <Container 
      safeArea 
      keyboardAvoiding 
      scrollable
    >
      <LinearGradient
        colors={isDarkMode ? ['#121212', '#151823'] : ['#f0f4ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <View className="p-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mb-6"
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDarkMode ? "#e5e7eb" : "#374151"} 
          />
        </TouchableOpacity>
        
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <StyledText
            variant="h3"
            weight="bold"
            className="mb-2"
          >
            {t('auth.forgot_password')}
          </StyledText>
          
          <StyledText
            variant="body"
            color="gray"
            className="mb-8"
          >
            {t('auth.enter_email_for_reset')}
          </StyledText>
        </Animated.View>
        
        {/* Hiển thị lỗi từ Redux store nếu có */}
        {error && !success && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30"
          >
            <StyledText 
              variant="caption" 
              color="error" 
              textAlign="center"
            >
              {error}
            </StyledText>
          </Animated.View>
        )}
        
        {success ? (
          <Animated.View 
            entering={FadeIn.duration(500)}
            className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg"
          >
            <StyledText
              variant="body"
              color="success"
              textAlign="center"
            >
              {t('auth.reset_link_sent')}
            </StyledText>
            <StyledText
              variant="caption"
              color={isDarkMode ? "lightGray" : "secondary"}
              textAlign="center"
              className="mt-2"
            >
              {t('auth.check_email_for_link')}
            </StyledText>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('auth.email')}
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="mail-outline" size={20} color={isDarkMode ? "#9ca3af" : "#6b7280"} />}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email ? t(errors.email.message as string) : undefined}
                  touched={value !== ''}
                />
              )}
            />
            
            <Button
              onPress={handleSubmit(onSubmit)}
              fullWidth
              isLoading={isLoading}
              className="mt-8"
            >
              {t('auth.send_reset_link')}
            </Button>
          </Animated.View>
        )}
        
        <Animated.View 
          entering={FadeInDown.delay(300).duration(500)}
          className="flex-row justify-center mt-6"
        >
          <StyledText variant="body-sm" color="gray">
            {t('auth.remember_password')}
          </StyledText>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="ml-1"
          >
            <StyledText variant="body-sm" color="primary" weight="medium">
              {t('auth.login_instead')}
            </StyledText>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Demo mode notification */}
      <DemoModeNotice position="bottom" />
    </Container>
  );
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ForgotPasswordScreen; 