import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ArrowUp } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  variant?: 'overload' | 'pr' | 'neutral';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { colors, radius } = useTheme();

  if (variant === 'overload') {
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: colors.accentTint,
            borderRadius: radius.control,
            borderColor: colors.accent,
            borderWidth: 1,
          },
          style,
        ]}
      >
        <ArrowUp size={12} color={colors.accent} strokeWidth={2.5} style={{ marginRight: 4 }} />
        <Text variant="micro" color="accent">
          {label}
        </Text>
      </View>
    );
  }

  if (variant === 'pr') {
    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: 'transparent',
            borderColor: colors.accent,
            borderWidth: 1,
            borderRadius: radius.control,
          },
          style,
        ]}
      >
        <Text variant="micro" color="accent">
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: 'transparent',
          borderColor: colors.outline,
          borderWidth: 1,
          borderRadius: radius.control,
        },
        style,
      ]}
    >
      <Text variant="micro" color="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 24,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
