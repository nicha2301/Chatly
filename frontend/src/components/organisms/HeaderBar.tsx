import React from 'react';
import { View, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '../atoms/StyledText';

interface HeaderBarAction {
  icon: string;
  onPress: () => void;
}

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightActions?: HeaderBarAction[];
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  showBackButton = false,
  rightActions = [],
}) => {
  const navigation = useNavigation();

  return (
    <>
      <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" />
      <View className="h-14 px-4 flex-row items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center">
          {showBackButton && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3"
            >
              <Ionicons name="chevron-back" size={24} color="#0072ff" />
            </TouchableOpacity>
          )}
          
          <View>
            <StyledText variant="h4" weight="bold" color="black">
              {title}
            </StyledText>
            
            {subtitle && (
              <StyledText variant="caption" color="gray" className="mt-0.5">
                {subtitle}
              </StyledText>
            )}
          </View>
        </View>

        <View className="flex-row items-center">
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={`action-${index}`}
              onPress={action.onPress}
              className="ml-4"
            >
              <Ionicons name={action.icon as any} size={22} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
};

export { HeaderBar };
