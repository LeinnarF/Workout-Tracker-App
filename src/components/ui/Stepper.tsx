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
  label: string;
  unit?: string;
}

export function Stepper({
  value,
  onChange,
  step,
  min = 0,
  label,
  unit,
}: StepperProps) {
  const { colors, radius } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStep = (direction: 1 | -1) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    const next = Math.max(min, Math.round((value + direction * step) * 10) / 10);
    onChange(next);
  };

  const startRepeating = (direction: 1 | -1) => {
    handleStep(direction);
    timerRef.current = setInterval(() => {
      handleStep(direction);
    }, 150);
  };

  const stopRepeating = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTextChange = (text: string) => {
    const clean = text.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, parsed));
    } else if (clean === '') {
      onChange(min);
    }
  };

  const fullLabel = unit ? `${label} ${unit}` : label;

  return (
    <View style={styles.container}>
      <Text variant="label" color="muted" style={styles.label}>
        {fullLabel}
      </Text>
      <View style={styles.controlsRow}>
        {/* Minus Button: Square 48dp, raised fill, 1px outline border, radius 2 */}
        <Pressable
          onPressIn={() => startRepeating(-1)}
          onPressOut={stopRepeating}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              backgroundColor: colors.raised,
              borderColor: pressed ? colors.text : colors.outline,
              borderRadius: radius.control,
            },
          ]}
        >
          <Minus size={20} color={colors.text} strokeWidth={1.75} />
        </Pressable>

        {/* Value Box: Boxed field, 1px outline, surface fill, radius 0 */}
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={[
            styles.valueContainer,
            {
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
            textAlign="center"
            textAlignVertical="center"
          />
        </Pressable>

        {/* Plus Button: Square 48dp, raised fill, 1px outline border, radius 2 */}
        <Pressable
          onPressIn={() => startRepeating(1)}
          onPressOut={stopRepeating}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              backgroundColor: colors.raised,
              borderColor: pressed ? colors.text : colors.outline,
              borderRadius: radius.control,
            },
          ]}
        >
          <Plus size={20} color={colors.text} strokeWidth={1.75} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 4,
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
    width: 48,
    height: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    height: 48,
    flex: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: '100%',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '500',
    fontFamily: 'IBMPlexMono_500Medium',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
});
