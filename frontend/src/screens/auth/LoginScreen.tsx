import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Alert, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSpring,
  withSequence,
  FadeIn,
  FadeInDown
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthStackParamList } from '../../navigation';
import { Container } from '../../components/atoms/Container';
import { Input } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { StyledText } from '../../components/atoms/StyledText';
import { useTranslation } from '../../i18n';
import { setToken, setUser } from '../../store/slices/userSlice';
import { RootState } from '../../store';
import authService, { LoginCredentials } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { DemoModeNotice } from '../../components/molecules/DemoModeNotice';

const { width, height } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Schema validation
const schema = yup.object().shape({
  email: yup.string().email('auth.invalid_email').required('auth.email_required'),
  password: yup.string().min(6, 'auth.password_min_length').required('auth.password_required'),
});

type FormData = {
  email: string;
  password: string;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const { isLoading, error } = useSelector((state: RootState) => state.user);
  const isDarkMode = colorScheme === 'dark';
  
  const { login, loginDemo, clearError } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemoMessage, setShowDemoMessage] = useState(true);

  // Animations
  const logoScale = useSharedValue(0.8);
  const formOpacity = useSharedValue(0);
  const buttonWidth = useSharedValue('80%');

  useEffect(() => {
    // Start animations when component mounts
    logoScale.value = withSpring(1, { damping: 10 });
    formOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    
    // Check if there are saved credentials
    const checkSavedCredentials = async () => {
      try {
        const savedInfo = await authService.getSavedLoginInfo();
        
        if (savedInfo) {
          setRememberMe(true);
          setValue('email', savedInfo.email);
        }
      } catch (error) {
        console.log('Error retrieving saved credentials:', error);
      }
    };
    
    checkSavedCredentials();
  }, []);

  // Xóa lỗi khi unmount
  useEffect(() => {
    return () => {
      if (error) {
        clearError();
      }
    };
  }, [error, clearError]);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }]
    };
  });

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
    };
  });

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Đăng nhập với thông tin đăng nhập và rememberMe
      await login({
        ...data,
        rememberMe,
      });
    } catch (error: any) {
      // Lỗi đã được xử lý trong useAuth hook
      console.log('Login error:', error.message);
    }
  };

  const handleLoginDemo = async () => {
    try {
      await loginDemo();
    } catch (error) {
      console.log('Demo login error:', error);
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
        {/* Logo */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(700).springify()}
          className="items-center mb-8 mt-10" 
          style={logoAnimatedStyle}
        >
          <Image
            source={require('../../../assets/icon.png')}
            style={{ width: 100, height: 100 }}
            resizeMode="contain"
          />
          <StyledText
            variant="h1"
            weight="bold"
            color="primary"
            className="mt-4"
          >
            Chatly
          </StyledText>
          <StyledText 
            variant="caption" 
            color="secondary"
            className="mt-2"
          >
            {t('app.tagline')}
          </StyledText>
        </Animated.View>

        {/* Login Form */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(700)} 
          style={[
            styles.formContainer, 
            formAnimatedStyle, 
            shadowStyle,
            { backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff' }
          ]}
        >
          <StyledText
            variant="h3"
            weight="bold"
            className="mb-6"
          >
            {t('auth.welcome_back')}
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

          {/* Hiển thị lỗi từ Redux store nếu có */}
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

          {/* Remember me & Forgot password */}
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View className={`w-5 h-5 border rounded flex items-center justify-center ${rememberMe ? 'bg-primary-500 border-primary-500' : 'border-gray-400'}`}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <StyledText variant="body-sm" color="gray" className="ml-2">
                {t('auth.remember_me')}
              </StyledText>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <StyledText variant="body-sm" color="primary" weight="medium">
                {t('auth.forgot_password')}
              </StyledText>
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <Animated.View entering={FadeInDown.delay(500).duration(700)}>
            <Button
              onPress={handleSubmit(onSubmit)}
              fullWidth
              isLoading={isLoading}
              size="large"
            >
              {t('auth.login')}
            </Button>
          </Animated.View>
          
          {/* Demo login button */}
          <AnimatedTouchable 
            entering={FadeInDown.delay(600).duration(700)}
            style={styles.demoButton}
            onPress={handleLoginDemo} 
            disabled={isLoading}
          >
            <StyledText variant="body-sm" color="secondary" weight="medium" textAlign="center">
              {t('auth.demo_login')}
            </StyledText>
          </AnimatedTouchable>

          {/* Register link */}
          <Animated.View 
            entering={FadeInDown.delay(700).duration(700)}
            className="flex-row justify-center mt-8"
          >
            <StyledText variant="body" color="gray">
              {t('auth.no_account')}
            </StyledText>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              className="ml-1"
            >
              <StyledText variant="body" color="primary" weight="medium">
                {t('auth.register')}
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
  demoButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
});

export default LoginScreen; 