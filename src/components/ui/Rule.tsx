import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export interface RuleProps {
  variant?: 'solid' | 'dashed';
  style?: ViewStyle;
}

export function Rule({ variant = 'solid', style }: RuleProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.rule,
        {
          borderColor: colors.outline,
          borderStyle: variant,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  rule: {
    width: '100%',
    borderBottomWidth: 1,
  },
});
