import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export interface FieldProps extends TextInputProps {
  label?: string;
  unit?: string;
  containerStyle?: ViewStyle;
  variant?: 'numeral' | 'title' | 'body';
}

export function Field({
  label,
  unit,
  containerStyle,
  style,
  onFocus,
  onBlur,
  variant = 'title',
  ...rest
}: FieldProps) {
  const { colors, border, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const fontStyle =
    variant === 'numeral'
      ? typography.numeral
      : variant === 'body'
      ? typography.body
      : {
          fontFamily: 'IBMPlexMono_500Medium',
          fontSize: 14,
          lineHeight: 22,
          fontWeight: '500' as const,
        };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" color="muted" style={styles.label}>
          {unit ? `${label} ${unit}` : label}
        </Text>
      )}
      <View
        style={[
          styles.fieldWrapper,
          {
            backgroundColor: colors.raised,
            borderColor: isFocused ? colors.accent : colors.outline,
            borderWidth: isFocused ? border.focus : border.width,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            fontStyle,
            {
              color: colors.text,
            },
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {unit && (
          <Text variant="label" color="muted" style={styles.unitTag}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
  },
  fieldWrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 0,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  unitTag: {
    marginLeft: 8,
  },
});
