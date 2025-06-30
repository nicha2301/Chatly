import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  interpolate,
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { StyledText } from '../components/atoms/StyledText';

const { width, height } = Dimensions.get('window');

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedText = Animated.createAnimatedComponent(StyledText);

const SplashScreen: React.FC = () => {
  // Get theme from Redux state
  const { colorScheme } = useSelector((state: RootState) => state.theme);
  const isDarkMode = colorScheme === 'dark';
  
  // Animation values
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const loaderOpacity = useSharedValue(0);
  const bubbleScale = useSharedValue(0);
  
  useEffect(() => {
    // Start animations when component mounts
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 800, easing: Easing.out(Easing.back()) }),
      withTiming(1, { duration: 300 })
    );
    
    logoOpacity.value = withTiming(1, { duration: 800 });
    
    textOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 800 })
    );
    
    textTranslateY.value = withDelay(
      500,
      withSpring(0, { damping: 6, stiffness: 100 })
    );
    
    loaderOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 500 })
    );
    
    bubbleScale.value = withDelay(
      300, 
      withTiming(1, { duration: 1000 })
    );
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });
  
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });
  
  const loaderAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: loaderOpacity.value
    };
  });
  
  const bubbleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: bubbleScale.value }],
      opacity: interpolate(bubbleScale.value, [0, 0.8, 1], [0, 0.8, 1]),
    };
  });

  return (
    <View 
      style={[
        styles.container, 
        { width, height },
        isDarkMode ? styles.darkContainer : null
      ]}
    >
      {/* Background bubble effect */}
      <Animated.View 
        style={[
          styles.bubble, 
          bubbleAnimatedStyle,
          isDarkMode ? styles.darkBubble : null
        ]} 
      />
      
      {/* Logo */}
      <AnimatedImage
        source={require('../../assets/splash.png')}
        style={[styles.logo, logoAnimatedStyle]}
        resizeMode="contain"
      />
      
      {/* App name */}
      <AnimatedText
        variant="h1"
        weight="bold"
        color="primary"
        style={textAnimatedStyle}
        className="mt-4"
      >
        Chatly
      </AnimatedText>
      
      {/* Tagline */}
      <AnimatedText
        variant="body"
        color={isDarkMode ? "white" : "secondary"}
        style={[textAnimatedStyle, { marginTop: 8 }]}
      >
        Chat an toàn, kết nối dễ dàng
      </AnimatedText>
      
      {/* Loading indicator */}
      <Animated.View style={loaderAnimatedStyle}>
        <ActivityIndicator 
          size="large" 
          color="#0072ff" 
          style={{ marginTop: 40 }} 
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Light mode background
  },
  darkContainer: {
    backgroundColor: '#121212', // Dark mode background
  },
  logo: {
    width: 160,
    height: 160,
  },
  bubble: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(0, 114, 255, 0.05)', // Very light blue for light mode
    top: -width * 0.4,
    left: -width * 0.25,
    zIndex: 0,
  },
  darkBubble: {
    backgroundColor: 'rgba(0, 114, 255, 0.15)', // Slightly stronger blue for dark mode
  }
});

export default SplashScreen; 