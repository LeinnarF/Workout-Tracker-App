import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Play, Pause, Square } from 'lucide-react-native';
import { useTimer } from '../../src/timer/TimerContext';
import { useTheme } from '../../src/theme/useTheme';
import { Screen, Text, Button } from '../../src/components/ui';

const PRESETS = [
  { label: '30s', ms: 30 * 1000 },
  { label: '1:00', ms: 60 * 1000 },
  { label: '1:30', ms: 90 * 1000 },
  { label: '2:00', ms: 120 * 1000 },
  { label: '2:30', ms: 150 * 1000 },
  { label: '3:00', ms: 180 * 1000 },
  { label: '4:00', ms: 4 * 60 * 1000 },
  { label: '5:00', ms: 5 * 60 * 1000 },
  { label: '10:00', ms: 10 * 60 * 1000 },
];

const TOTAL_SEGMENTS = 16;

export default function TimerScreen() {
  const {
    isRunning,
    timeRemainingMs,
    initialDurationMs,
    startTimer,
    pauseTimer,
    resetTimer,
    addTime,
  } = useTimer();

  const { colors, radius, border, typography } = useTheme();

  const [selectedDurationMs, setSelectedDurationMs] = useState(90 * 1000); // 1:30 default
  const [customMin, setCustomMin] = useState('1');
  const [customSec, setCustomSec] = useState('30');
  const [hasFinished, setHasFinished] = useState(false);
  const prevRemainingRef = useRef(timeRemainingMs);

  const isTimerActive = isRunning || timeRemainingMs > 0;

  // Detect completion
  useEffect(() => {
    if (prevRemainingRef.current > 0 && timeRemainingMs === 0 && !isRunning && initialDurationMs > 0) {
      setHasFinished(true);
      const timer = setTimeout(() => {
        setHasFinished(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    prevRemainingRef.current = timeRemainingMs;
  }, [timeRemainingMs, isRunning, initialDurationMs]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectPreset = (ms: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    Keyboard.dismiss();
    if (isTimerActive) {
      resetTimer();
    }
    setSelectedDurationMs(ms);

    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    setCustomMin(m.toString());
    setCustomSec(s.toString().padStart(2, '0'));
  };

  const handleCustomMinChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 2);
    setCustomMin(clean);

    const m = parseInt(clean, 10) || 0;
    const s = parseInt(customSec, 10) || 0;
    const totalMs = (m * 60 + s) * 1000;

    if (isTimerActive) {
      resetTimer();
    }
    setSelectedDurationMs(totalMs);
  };

  const handleCustomMinBlur = () => {
    if (customMin === '') {
      setCustomMin('0');
    }
  };

  const handleCustomSecChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 2);
    setCustomSec(clean);

    const m = parseInt(customMin, 10) || 0;
    const s = parseInt(clean, 10) || 0;
    const totalMs = (m * 60 + s) * 1000;

    if (isTimerActive) {
      resetTimer();
    }
    setSelectedDurationMs(totalMs);
  };

  const handleCustomSecBlur = () => {
    if (customSec === '') {
      setCustomSec('00');
    } else if (customSec.length === 1) {
      setCustomSec(customSec.padStart(2, '0'));
    }
  };

  const handleAdd30s = () => {
    Keyboard.dismiss();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    if (isTimerActive) {
      addTime(30 * 1000);
    } else {
      const nextMs = selectedDurationMs + 30 * 1000;
      setSelectedDurationMs(nextMs);
      const totalSec = Math.floor(nextMs / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      setCustomMin(m.toString());
      setCustomSec(s.toString().padStart(2, '0'));
    }
  };

  const handleToggleTimer = () => {
    Keyboard.dismiss();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore
    }

    if (isRunning) {
      pauseTimer(timeRemainingMs);
    } else if (isTimerActive) {
      startTimer(timeRemainingMs);
    } else {
      if (selectedDurationMs > 0) {
        startTimer(selectedDurationMs);
      }
    }
  };

  const handleReset = () => {
    if (!isTimerActive) return;
    Keyboard.dismiss();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    resetTimer();
  };

  const displayMs = isTimerActive ? timeRemainingMs : selectedDurationMs;

  // Segmented block bar calculation (starts empty, fills as time elapses)
  const progressRatio = isTimerActive && initialDurationMs > 0
    ? Math.min(1, Math.max(0, (initialDurationMs - timeRemainingMs) / initialDurationMs))
    : hasFinished
    ? 1
    : 0;
  const activeSegments = Math.round(progressRatio * TOTAL_SEGMENTS);

  const statusLabel = isRunning
    ? 'RESTING'
    : isTimerActive
    ? 'PAUSED'
    : hasFinished
    ? 'REST COMPLETE'
    : 'READY';

  return (
    <Screen title="REST TIMER" subtitle={statusLabel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Main Timer Display Card (Fills with accentTint when finished) */}
        <View
          style={[
            styles.timerCard,
            {
              backgroundColor: hasFinished ? colors.accentTint : colors.surface,
              borderColor: hasFinished ? colors.accent : colors.outline,
            },
          ]}
        >
          {/* Status Label */}
          <View style={styles.statusRow}>
            <Text
              variant="label"
              color={isRunning || hasFinished ? 'accent' : isTimerActive ? 'primary' : 'muted'}
            >
              {statusLabel}
            </Text>
          </View>

          {/* Centered Remaining Time in DISPLAY typography (Fixed-width mono) */}
          <Text
            variant="display"
            color={hasFinished ? 'accent' : 'primary'}
            style={styles.timeText}
          >
            {formatTime(displayMs)}
          </Text>

          {/* Segmented Block Bar (Industrial progress meter) */}
          <View style={styles.segmentBarContainer}>
            {Array.from({ length: TOTAL_SEGMENTS }).map((_, idx) => {
              const isActive = idx < activeSegments;
              return (
                <View
                  key={idx}
                  style={[
                    styles.segmentBlock,
                    {
                      borderColor: colors.outline,
                      backgroundColor: isActive
                        ? colors.accent
                        : colors.raised,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Transport Controls: RESET (Secondary), START/PAUSE (Primary), 30S (Secondary) */}
        <View style={styles.controlsRow}>
          {/* RESET BUTTON */}
          <Pressable
            onPress={handleReset}
            disabled={!isTimerActive}
            style={({ pressed }) => [
              styles.secondarySquareBtn,
              {
                backgroundColor: colors.raised,
                borderColor: pressed ? colors.text : colors.outline,
                borderRadius: radius.control,
                opacity: !isTimerActive ? 0.4 : 1,
              },
            ]}
          >
            <Square size={20} color={colors.text} strokeWidth={1.75} />
          </Pressable>

          {/* TOGGLE START / PAUSE / RESUME BUTTON */}
          <View style={styles.primaryBtnWrapper}>
            <Button
              label={isRunning ? 'PAUSE' : isTimerActive ? 'RESUME' : 'START'}
              variant="primary"
              onPress={handleToggleTimer}
              disabled={selectedDurationMs <= 0 && !isTimerActive}
              icon={
                isRunning ? (
                  <Pause size={20} color={colors.onAccent} strokeWidth={2} />
                ) : (
                  <Play size={20} color={colors.onAccent} strokeWidth={2} />
                )
              }
            />
          </View>

          {/* +30S EXTENSION BUTTON */}
          <Pressable
            onPress={handleAdd30s}
            style={({ pressed }) => [
              styles.secondarySquareBtn,
              {
                backgroundColor: colors.raised,
                borderColor: pressed ? colors.text : colors.outline,
                borderRadius: radius.control,
              },
            ]}
          >
            <Text variant="title" color="primary">
              30S
            </Text>
          </Pressable>
        </View>

        {/* Custom Duration Section (Above Presets, fills horizontal width) */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <Text variant="label" color="muted" style={styles.sectionHeader}>
            CUSTOM DURATION
          </Text>
          <View style={styles.customRow}>
            {/* MIN Field */}
            <View style={styles.customInputCol}>
              <Text variant="micro" color="muted" style={styles.inputSublabel}>
                MIN
              </Text>
              <View
                style={[
                  styles.fieldBox,
                  {
                    backgroundColor: colors.raised,
                    borderColor: colors.outline,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.numericInput,
                    typography.numeral,
                    { color: colors.text },
                  ]}
                  textAlign="center"
                  textAlignVertical="center"
                  keyboardType="number-pad"
                  value={customMin}
                  onChangeText={handleCustomMinChange}
                  onBlur={handleCustomMinBlur}
                  selectTextOnFocus
                  maxLength={2}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            </View>

            <Text variant="title" color="muted" style={styles.colonText}>
              :
            </Text>

            {/* SEC Field */}
            <View style={styles.customInputCol}>
              <Text variant="micro" color="muted" style={styles.inputSublabel}>
                SEC
              </Text>
              <View
                style={[
                  styles.fieldBox,
                  {
                    backgroundColor: colors.raised,
                    borderColor: colors.outline,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.numericInput,
                    typography.numeral,
                    { color: colors.text },
                  ]}
                  textAlign="center"
                  textAlignVertical="center"
                  keyboardType="number-pad"
                  value={customSec}
                  onChangeText={handleCustomSecChange}
                  onBlur={handleCustomSecBlur}
                  selectTextOnFocus
                  maxLength={2}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Presets Section (Row of Square Chips) */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <Text variant="label" color="muted" style={styles.sectionHeader}>
            QUICK PRESETS
          </Text>
          <View style={styles.presetsGrid}>
            {PRESETS.map((p) => {
              const isSelected =
                (isTimerActive && initialDurationMs === p.ms) ||
                (!isTimerActive && selectedDurationMs === p.ms);

              return (
                <Pressable
                  key={p.label}
                  onPress={() => handleSelectPreset(p.ms)}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? colors.accentTint : colors.raised,
                      borderColor: isSelected ? colors.accent : colors.outline,
                      borderRadius: radius.control,
                      borderWidth: isSelected ? border.focus : border.width,
                    },
                  ]}
                >
                  <Text
                    variant="label"
                    color={isSelected ? 'accent' : 'primary'}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    width: '100%',
  },
  timerCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusRow: {
    marginBottom: 8,
  },
  timeText: {
    marginVertical: 12,
    textAlign: 'center',
  },
  segmentBarContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 18,
    gap: 3,
    marginTop: 16,
  },
  segmentBlock: {
    flex: 1,
    height: '100%',
    borderWidth: 1,
    borderRadius: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  secondarySquareBtn: {
    width: 56,
    height: 56,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnWrapper: {
    flex: 1,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  customInputCol: {
    flex: 1,
  },
  inputSublabel: {
    marginBottom: 4,
    textAlign: 'center',
  },
  fieldBox: {
    height: 48,
    borderWidth: 1,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numericInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    padding: 0,
  },
  colonText: {
    marginTop: 14,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  presetChip: {
    width: '31%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
