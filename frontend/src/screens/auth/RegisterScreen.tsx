import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Alert, 
  Image, 
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue,
  withDelay,
  withTiming,
  useAnimatedStyle
} from 'react-native-reanimated';
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

const { width, height } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Schema validation
const schema = yup.object().shape({
  fullName: yup.string().required('auth.fullName_required'),
  email: yup.string().email('auth.invalid_email').required('auth.email_required'),
  password: yup.string().min(6, 'auth.password_min_length').required('auth.password_required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'auth.passwords_must_match')
    .required('auth.confirm_password_required'),
});

type FormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useDispatch();
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const isDarkMode = colorScheme === 'dark';
  
  const { isLoading, error, register, clearError } = useAuth();
  const [showDemoMessage, setShowDemoMessage] = useState(true);
  
  // Animations
  const formOpacity = useSharedValue(0);
  
  React.useEffect(() => {
    // Animation when component mounts
    formOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
  }, []);
  
  // Xóa lỗi khi unmount
  useEffect(() => {
    return () => {
      if (error) {
        clearError();
      }
    };
  }, [error, clearError]);
  
  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
    };
  });

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Đăng ký với các thông tin đã nhập
      await register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        username: data.fullName.toLowerCase().replace(/\s+/g, '.'),
      });
    } catch (error: any) {
      // Lỗi đã được xử lý trong useAuth hook
      console.log('Registration error:', error.message);
    }
  };

  const backgroundColors = isDarkMode 
    ? ['#121212', '#151823', '#1e2132'] 
    : ['#f0f4ff', '#ffffff', '#ffffff'];
    
  const shadowStyle = isDarkMode
    ? {}
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
      };

  return (
    <Container
      safeArea
      keyboardAvoiding
      scrollable
      contentContainerStyle={styles.container}
    >
      <AnimatedLinearGradient
        colors={backgroundColors}
        style={[styles.background, { width, height }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View className="w-full p-6 flex-1">
        {/* Logo and header */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(700)}
          className="items-center mb-8"
        >
          <Image
            source={require('../../../assets/icon.png')}
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
          <StyledText variant="h2" weight="bold" color="primary" className="mt-3">
            {t('app.name')}
          </StyledText>
        </Animated.View>

        {/* Registration Form */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(700)} 
          style={[
            styles.formContainer, 
            formAnimatedStyle, 
            shadowStyle,
            { backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff' }
          ]}
        >
          <StyledText variant="h3" weight="bold" className="mb-6">
            {t('auth.register')}
          </StyledText>

          {showDemoMessage && (
            <Animated.View 
              entering={FadeIn.delay(800).duration(500)}
              className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30"
            >
              <StyledText variant="caption" color={isDarkMode ? "lightGray" : "secondary"}>
                {t('auth.demo_mode_notice')}
              </StyledText>
            </Animated.View>
          )}
          
          {/* Display error from Redux store if any */}
          {error && (
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

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.fullName')}
                placeholder={t('auth.fullName')}
                leftIcon={<Ionicons name="person-outline" size={20} color={isDarkMode ? "#9ca3af" : "#6b7280"} />}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.fullName ? t(errors.fullName.message as string) : undefined}
                touched={value !== ''}
                className="mb-4"
              />
            )}
          />

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
                className="mb-4"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.password')}
                placeholder="********"
                secureTextEntry
                showPasswordToggle
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? "#9ca3af" : "#6b7280"} />}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password ? t(errors.password.message as string) : undefined}
                touched={value !== ''}
                className="mb-4"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.confirmPassword')}
                placeholder="********"
                secureTextEntry
                showPasswordToggle
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? "#9ca3af" : "#6b7280"} />}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword ? t(errors.confirmPassword.message as string) : undefined}
                touched={value !== ''}
                className="mb-6"
              />
            )}
          />

          {/* Register button */}
          <Animated.View entering={FadeInDown.delay(500).duration(700)}>
            <Button
              onPress={handleSubmit(onSubmit)}
              fullWidth
              isLoading={isLoading}
              size="large"
            >
              {t('auth.register')}
            </Button>
          </Animated.View>

          {/* Login link */}
          <Animated.View 
            entering={FadeInDown.delay(600).duration(700)}
            className="flex-row justify-center mt-8"
          >
            <StyledText variant="body" color="gray">
              {t('auth.haveAccount')}
            </StyledText>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              className="ml-1"
            >
              <StyledText variant="body" color="primary" weight="medium">
                {t('auth.login')}
              </StyledText>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
      
      {/* Demo mode notification */}
      <DemoModeNotice position="bottom" />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  formContainer: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
});

export default RegisterScreen; 