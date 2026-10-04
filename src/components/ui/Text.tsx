import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { typography } from '../../theme/tokens';

export type TextVariant = 'display' | 'numeral' | 'title' | 'body' | 'label' | 'micro';
export type TextColor = 'primary' | 'muted' | 'accent' | 'onAccent';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...rest
}: TextProps) {
  const { colors } = useTheme();

  const colorMap = {
    primary: colors.text,
    muted: colors.textMuted,
    accent: colors.accent,
    onAccent: colors.onAccent,
  };

  const isUppercase = variant === 'title' || variant === 'label' || variant === 'micro';

  return (
    <RNText
      style={[
        styles.base,
        typography[variant],
        { color: colorMap[color] },
        style,
      ]}
      {...rest}
    >
      {typeof children === 'string' && isUppercase ? children.toUpperCase() : children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});
