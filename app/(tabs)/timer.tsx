import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTimer } from '../../src/timer/TimerContext';

const PRESETS = [
  { label: '30s', ms: 30 * 1000 },
  { label: '1:00', ms: 60 * 1000 },
  { label: '1:30', ms: 90 * 1000 },
  { label: '2:00', ms: 120 * 1000 },
  { label: '2:30', ms: 150 * 1000 },
  { label: '3:00', ms: 180 * 1000 },
];

export default function TimerScreen() {
  const {
    isRunning,
    timeRemainingMs,
    initialDurationMs,
    startTimer,
    pauseTimer,
    resetTimer,
  } = useTimer();

  const [selectedDurationMs, setSelectedDurationMs] = useState(90 * 1000); // 1:30 default
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartCustom = () => {
    const m = parseInt(customMin, 10) || 0;
    const s = parseInt(customSec, 10) || 0;
    const totalMs = (m * 60 + s) * 1000;
    if (totalMs > 0) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // ignore
      }
      setSelectedDurationMs(totalMs);
      startTimer(totalMs);
      setCustomMin('');
      setCustomSec('');
    }
  };

  const handleSelectPreset = (ms: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore
    }
    setSelectedDurationMs(ms);
    startTimer(ms);
  };

  // Dial calculations
  const size = 230;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const isTimerActive = isRunning || timeRemainingMs > 0;
  const progress =
    initialDurationMs > 0
      ? Math.min(1, Math.max(0, timeRemainingMs / initialDurationMs))
      : 1;
  const strokeDashoffset = circumference * (1 - progress);

  const displayMs = isTimerActive ? timeRemainingMs : selectedDurationMs;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Circular Progress Dial */}
          <View style={styles.dialContainer}>
            <View style={styles.dialWrapper}>
              <Svg width={size} height={size} style={styles.svgRing}>
                {/* Background Track */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#E9EBF0"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Progress Arc */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={
                    isRunning
                      ? '#007AFF'
                      : isTimerActive
                      ? '#FF9500'
                      : '#007AFF'
                  }
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={isTimerActive ? strokeDashoffset : 0}
                  strokeLinecap="round"
                  fill="transparent"
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              </Svg>

              {/* Inside dial text */}
              <View style={styles.dialContent}>
                <View
                  style={[
                    styles.statusBadge,
                    isRunning
                      ? styles.statusBadgeRunning
                      : isTimerActive
                      ? styles.statusBadgePaused
                      : styles.statusBadgeReady,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      isRunning
                        ? styles.statusDotRunning
                        : isTimerActive
                        ? styles.statusDotPaused
                        : styles.statusDotReady,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      isRunning
                        ? styles.statusTextRunning
                        : isTimerActive
                        ? styles.statusTextPaused
                        : styles.statusTextReady,
                    ]}
                  >
                    {isRunning ? 'RESTING' : isTimerActive ? 'PAUSED' : 'READY'}
                  </Text>
                </View>

                <Text style={styles.timeDisplay}>{formatTime(displayMs)}</Text>
              </View>
            </View>
          </View>

          {/* Controls Row: Square (Stop/Reset) and Triangle/Pause (Play/Pause) */}
          <View style={styles.controlsRow}>
            {/* Square Button: Stop / Reset */}
            <TouchableOpacity
              style={[
                styles.controlBtnSquare,
                !isTimerActive && styles.controlBtnDisabled,
              ]}
              onPress={() => {
                if (isTimerActive) {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {
                    // ignore
                  }
                  resetTimer();
                }
              }}
              disabled={!isTimerActive}
              activeOpacity={0.7}
            >
              <FontAwesome
                name="stop"
                size={18}
                color={isTimerActive ? '#FF3B30' : '#C7C7CC'}
              />
            </TouchableOpacity>

            {/* Triangle / Pause Button: Play / Pause / Resume */}
            {isRunning ? (
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.pauseActionBtn]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {
                    // ignore
                  }
                  pauseTimer(timeRemainingMs);
                }}
                activeOpacity={0.8}
              >
                <FontAwesome name="pause" size={24} color="#fff" />
              </TouchableOpacity>
            ) : isTimerActive ? (
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.resumeActionBtn]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {
                    // ignore
                  }
                  startTimer(timeRemainingMs);
                }}
                activeOpacity={0.8}
              >
                <FontAwesome
                  name="play"
                  size={24}
                  color="#fff"
                  style={{ marginLeft: 3 }}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.startActionBtn]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {
                    // ignore
                  }
                  startTimer(selectedDurationMs);
                }}
                activeOpacity={0.8}
              >
                <FontAwesome
                  name="play"
                  size={26}
                  color="#fff"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Presets Card (Title Removed) */}
          <View style={styles.card}>
            <View style={styles.presetsGrid}>
              {PRESETS.map((p) => {
                const isSelected =
                  (isTimerActive && initialDurationMs === p.ms) ||
                  (!isTimerActive && selectedDurationMs === p.ms);
                return (
                  <TouchableOpacity
                    key={p.label}
                    style={[
                      styles.presetBtn,
                      isSelected && styles.presetBtnActive,
                    ]}
                    onPress={() => handleSelectPreset(p.ms)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        isSelected && styles.presetBtnTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Custom Duration Card (Title Removed) */}
          <View style={styles.card}>
            <View style={styles.customRow}>
              <View style={styles.customInputGroup}>
                <Text style={styles.customInputLabel}>MIN</Text>
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#C7C7CC"
                  value={customMin}
                  onChangeText={setCustomMin}
                  maxLength={2}
                />
              </View>

              <Text style={styles.customColon}>:</Text>

              <View style={styles.customInputGroup}>
                <Text style={styles.customInputLabel}>SEC</Text>
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  placeholder="00"
                  placeholderTextColor="#C7C7CC"
                  value={customSec}
                  onChangeText={setCustomSec}
                  maxLength={2}
                />
              </View>

              <TouchableOpacity
                style={styles.customStartBtn}
                onPress={handleStartCustom}
                activeOpacity={0.7}
              >
                <Text style={styles.customStartBtnText}>Set Timer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  dialContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialWrapper: {
    width: 230,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dialContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    gap: 6,
  },
  statusBadgeRunning: {
    backgroundColor: '#EFF6FF',
  },
  statusBadgePaused: {
    backgroundColor: '#FFF7ED',
  },
  statusBadgeReady: {
    backgroundColor: '#F2F2F7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotRunning: {
    backgroundColor: '#007AFF',
  },
  statusDotPaused: {
    backgroundColor: '#FF9500',
  },
  statusDotReady: {
    backgroundColor: '#8E8E93',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusTextRunning: {
    color: '#007AFF',
  },
  statusTextPaused: {
    color: '#FF9500',
  },
  statusTextReady: {
    color: '#8E8E93',
  },
  timeDisplay: {
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: '#1C1C1E',
    letterSpacing: -1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
    width: '100%',
  },
  controlBtnSquare: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  controlBtnDisabled: {
    opacity: 0.45,
    borderColor: '#F2F2F7',
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryActionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  startActionBtn: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
  },
  pauseActionBtn: {
    backgroundColor: '#FF9500',
    shadowColor: '#FF9500',
  },
  resumeActionBtn: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    width: '100%',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  presetBtn: {
    width: '31%',
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  presetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  presetBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  customInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  customInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  customInput: {
    width: '100%',
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  customColon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 14,
  },
  customStartBtn: {
    backgroundColor: '#007AFF',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  customStartBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
