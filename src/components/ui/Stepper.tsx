import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  step: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  compact?: boolean;
}

export function Stepper({
  value,
  onChange,
  step,
  min = 0,
  max,
  label,
  unit,
  compact = false,
}: StepperProps) {
  const { colors, radius } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeating = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStep = (direction: 1 | -1) => {
    if (direction === 1 && max !== undefined && value >= max) {
      stopRepeating();
      return;
    }
    if (direction === -1 && min !== undefined && value <= min) {
      stopRepeating();
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    const rawNext = Math.round((value + direction * step) * 10) / 10;
    const clampedMin = Math.max(min, rawNext);
    const next = max !== undefined ? Math.min(max, clampedMin) : clampedMin;
    onChange(next);
  };

  const startRepeating = (direction: 1 | -1) => {
    handleStep(direction);
    timerRef.current = setInterval(() => {
      handleStep(direction);
    }, 150);
  };

  const handleTextChange = (text: string) => {
    const clean = text.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) {
      const clampedMin = Math.max(min, parsed);
      const next = max !== undefined ? Math.min(max, clampedMin) : clampedMin;
      onChange(next);
    } else if (clean === '') {
      onChange(min);
    }
  };

  const fullLabel = unit ? `${label} ${unit}` : label;
  const isMinusDisabled = min !== undefined && value <= min;
  const isPlusDisabled = max !== undefined && value >= max;

  const buttonHeight = compact ? 40 : 48;
  const buttonWidth = compact ? 32 : 38;
  const iconSize = compact ? 16 : 18;

  return (
    <View style={styles.container}>
      <Text variant={compact ? 'micro' : 'label'} color="muted" style={styles.label}>
        {fullLabel}
      </Text>
      <View style={styles.controlsRow}>
        {/* Minus Button */}
        <Pressable
          onPressIn={() => !isMinusDisabled && startRepeating(-1)}
          onPressOut={stopRepeating}
          disabled={isMinusDisabled}
          hitSlop={6}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              width: buttonWidth,
              height: buttonHeight,
              backgroundColor: colors.raised,
              borderColor: isMinusDisabled ? colors.outline : pressed ? colors.text : colors.outline,
              borderRadius: radius.control,
              opacity: isMinusDisabled ? 0.35 : 1,
            },
          ]}
        >
          <Minus size={iconSize} color={isMinusDisabled ? colors.textMuted : colors.text} strokeWidth={1.75} />
        </Pressable>

        {/* Value Box: Boxed field, 1px outline, surface fill, radius 0 */}
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={[
            styles.valueContainer,
            {
              height: buttonHeight,
              minWidth: compact ? 44 : 56,
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: colors.text,
              },
            ]}
            keyboardType="decimal-pad"
            value={value.toString()}
            onChangeText={handleTextChange}
            selectTextOnFocus
            multiline={false}
            numberOfLines={1}
            textAlign="center"
            textAlignVertical="center"
          />
        </Pressable>

        {/* Plus Button */}
        <Pressable
          onPressIn={() => !isPlusDisabled && startRepeating(1)}
          onPressOut={stopRepeating}
          disabled={isPlusDisabled}
          hitSlop={6}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              width: buttonWidth,
              height: buttonHeight,
              backgroundColor: colors.raised,
              borderColor: isPlusDisabled ? colors.outline : pressed ? colors.text : colors.outline,
              borderRadius: radius.control,
              opacity: isPlusDisabled ? 0.35 : 1,
            },
          ]}
        >
          <Plus size={iconSize} color={isPlusDisabled ? colors.textMuted : colors.text} strokeWidth={1.75} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 0,
    flex: 1,
  },
  label: {
    marginBottom: 4,
    alignSelf: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepperButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: '100%',
    fontSize: 22,
    fontWeight: '500',
    fontFamily: 'IBMPlexMono_500Medium',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
});
