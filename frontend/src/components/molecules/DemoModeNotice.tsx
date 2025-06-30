import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeOutUp, 
  interpolateColor, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  cancelAnimation,
  Easing 
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { StyledText } from '../atoms/StyledText';
import { useTranslation } from '../../i18n';
import { RootState } from '../../store';
import authService from '../../services/authService';

interface DemoModeNoticeProps {
  onDismiss?: () => void;
  showDismissButton?: boolean;
  position?: 'top' | 'bottom';
  style?: any;
}

const DemoModeNotice: React.FC<DemoModeNoticeProps> = ({ 
  onDismiss, 
  showDismissButton = true,
  position = 'bottom',
  style
}) => {
  const { t } = useTranslation();
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const isDarkMode = colorScheme === 'dark';
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const pulsateValue = useSharedValue(0);
  
  useEffect(() => {
    // Kiểm tra xem có đang ở chế độ demo không
    const checkDemoMode = async () => {
      const isDemo = await authService.isDemoMode();
      setIsDemoMode(isDemo);
      setIsVisible(isDemo);
      
      if (isDemo) {
        // Bắt đầu hiệu ứng nhịp đập
        pulsateValue.value = withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), 
          -1, // -1 có nghĩa là lặp lại vô hạn
          true // true có nghĩa là reverse mỗi lần
        );
      }
    };
    
    checkDemoMode();
    
    return () => {
      // Dừng animation khi component unmount
      cancelAnimation(pulsateValue);
    };
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      pulsateValue.value,
      [0, 1],
      [
        isDarkMode ? 'rgba(37, 99, 235, 0.1)' : 'rgba(219, 234, 254, 1)',
        isDarkMode ? 'rgba(30, 58, 138, 0.3)' : 'rgba(191, 219, 254, 1)'
      ]
    );
    
    const borderColor = interpolateColor(
      pulsateValue.value,
      [0, 1],
      [
        isDarkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(59, 130, 246, 0.5)',
        isDarkMode ? 'rgba(30, 58, 138, 0.5)' : 'rgba(37, 99, 235, 0.7)'
      ]
    );
    
    return {
      backgroundColor,
      borderColor,
    };
  });
  
  if (!isVisible || !isDemoMode) {
    return null;
  }
  
  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.container,
        animatedStyle,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        style
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name="information-circle-outline" 
          size={24} 
          color={isDarkMode ? "#60a5fa" : "#2563eb"} 
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <StyledText 
            variant="body-sm" 
            weight="medium" 
            color={isDarkMode ? "lightGray" : "default"}
          >
            {t('app.demo_mode')}
          </StyledText>
          <StyledText 
            variant="caption" 
            color="secondary"
          >
            {t('app.demo_mode_description')}
          </StyledText>
        </View>
        
        {showDismissButton && (
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
            <Ionicons 
              name="close" 
              size={20} 
              color={isDarkMode ? "#9ca3af" : "#6b7280"} 
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '92%',
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'absolute',
    zIndex: 1000,
  },
  topPosition: {
    top: 16,
  },
  bottomPosition: {
    bottom: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
});

export default DemoModeNotice; 