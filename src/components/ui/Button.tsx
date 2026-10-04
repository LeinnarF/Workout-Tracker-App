import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    onPress();
  };

  const isPrimary = variant === 'primary';

  let backgroundColor = colors.surface;
  let borderColor = colors.outline;
  let textColor: 'primary' | 'muted' | 'accent' | 'onAccent' = 'primary';
  const height = isPrimary ? 56 : 48;

  if (isPrimary) {
    if (disabled) {
      backgroundColor = colors.raised;
      borderColor = colors.outline;
      textColor = 'muted';
    } else if (isPressed) {
      backgroundColor = colors.accentTint;
      borderColor = colors.accent;
      textColor = 'accent';
    } else {
      backgroundColor = colors.accent;
      borderColor = colors.accent;
      textColor = 'onAccent';
    }
  } else {
    // Secondary
    if (disabled) {
      backgroundColor = colors.raised;
      borderColor = colors.outline;
      textColor = 'muted';
    } else if (isPressed) {
      backgroundColor = colors.raised;
      borderColor = colors.text;
      textColor = 'primary';
    } else {
      backgroundColor = colors.raised;
      borderColor = colors.outline;
      textColor = 'primary';
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          height,
          backgroundColor,
          borderColor,
          borderRadius: radius.control,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? colors.onAccent : colors.text}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            variant="title"
            color={textColor}
            style={[styles.text, textStyle]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    textAlign: 'center',
  },
});
