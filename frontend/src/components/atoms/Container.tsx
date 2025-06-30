import React from 'react';
import { 
  View, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  safeArea?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  scrollable = false,
  keyboardAvoiding = false,
  safeArea = true,
  backgroundColor = 'bg-white',
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
}) => {
  // Xác định container chính
  const MainContainer = safeArea ? SafeAreaView : View;
  
  // Tạo nội dung
  const content = scrollable ? (
    <ScrollView 
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentContainerStyle} className="flex-1">
      {children}
    </View>
  );

  // Xác định nội dung chính bao gồm cả keyboard avoiding nếu cần
  const mainContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <MainContainer className={`flex-1 ${backgroundColor}`} style={style}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {mainContent}
    </MainContainer>
  );
}; 