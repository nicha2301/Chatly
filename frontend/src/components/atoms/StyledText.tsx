import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

type VariantType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body-sm' | 'caption';
type WeightType = 'normal' | 'medium' | 'semibold' | 'bold';
type ColorType = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'black' | 'white' | 'gray';
type AlignType = 'auto' | 'left' | 'right' | 'center' | 'justify';

interface StyledTextProps extends TextProps {
  variant?: VariantType;
  weight?: WeightType;
  color?: ColorType;
  align?: AlignType;
  children: React.ReactNode;
}

export const StyledText = ({
  variant = 'body',
  weight = 'normal',
  color = 'black',
  align = 'auto',
  style,
  children,
  ...props
}: StyledTextProps) => {
  const fontSizeStyles: Record<VariantType, TextStyle> = {
    h1: { fontSize: 32, lineHeight: 40 },
    h2: { fontSize: 28, lineHeight: 36 },
    h3: { fontSize: 24, lineHeight: 32 },
    h4: { fontSize: 20, lineHeight: 28 },
    h5: { fontSize: 18, lineHeight: 26 },
    h6: { fontSize: 16, lineHeight: 24 },
    body: { fontSize: 16, lineHeight: 24 },
    'body-sm': { fontSize: 14, lineHeight: 20 },
    caption: { fontSize: 12, lineHeight: 18 },
  };

  const fontWeightStyles: Record<WeightType, TextStyle> = {
    normal: { fontWeight: '400' },
    medium: { fontWeight: '500' },
    semibold: { fontWeight: '600' },
    bold: { fontWeight: '700' },
  };

  const colorStyles: Record<ColorType, string> = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    error: 'text-error-500',
    black: 'text-gray-900',
    white: 'text-white',
    gray: 'text-gray-500',
  };

  const alignStyles: Record<AlignType, string> = {
    auto: 'text-left',
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
    justify: 'text-justify',
  };

  const variantStyle = fontSizeStyles[variant];
  const weightStyle = fontWeightStyles[weight];
  const colorStyle = colorStyles[color];
  const alignStyle = alignStyles[align];

  return (
    <Text 
      className={`${colorStyle} ${alignStyle}`}
      style={[variantStyle, weightStyle, style]}
      {...props}
    >
      {children}
    </Text>
  );
}; 
