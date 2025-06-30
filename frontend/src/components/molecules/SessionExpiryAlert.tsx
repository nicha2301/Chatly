import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { StyledText } from '../atoms/StyledText';
import { useTranslation } from '../../i18n';
import { RootState } from '../../store';
import { useSessionExpirationAlert } from '../../hooks/useSessionExpirationAlert';

interface SessionExpiryAlertProps {
  position?: 'top' | 'bottom';
  style?: any;
}

const SessionExpiryAlert: React.FC<SessionExpiryAlertProps> = ({ 
  position = 'bottom',
  style
}) => {
  const { t } = useTranslation();
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const isDarkMode = colorScheme === 'dark';
  
  const { 
    showWarning, 
    formattedRemaining, 
    extendSession, 
    warningMessage 
  } = useSessionExpirationAlert();
  
  if (!showWarning) {
    return null;
  }
  
  const handleExtend = () => {
    extendSession();
  };
  
  return (
    <Animated.View
      entering={FadeInUp.duration(500)}
      exiting={FadeOutDown.duration(300)}
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        style
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name="time-outline" 
          size={24} 
          color={isDarkMode ? "#f97316" : "#ea580c"} 
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <StyledText 
            variant="body-sm" 
            weight="medium" 
            color={isDarkMode ? "lightGray" : "default"}
          >
            {t('auth.session_expiry_title')}
          </StyledText>
          <StyledText 
            variant="caption" 
            color="warning"
          >
            {warningMessage}
          </StyledText>
        </View>
        
        <TouchableOpacity onPress={handleExtend} style={styles.extendButton}>
          <StyledText 
            variant="button" 
            weight="medium" 
            color="primary"
          >
            {t('auth.extend')}
          </StyledText>
        </TouchableOpacity>
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
  lightContainer: {
    backgroundColor: 'rgba(255, 237, 213, 1)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  darkContainer: {
    backgroundColor: 'rgba(67, 20, 7, 0.4)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
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
  extendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
});

export default SessionExpiryAlert; 