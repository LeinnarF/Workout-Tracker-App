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
    addTime,
  } = useTimer();

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
      startTimer(totalMs);
    }
  };

  // Dial calculations
  const size = 220;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress =
    initialDurationMs > 0
      ? Math.min(1, Math.max(0, timeRemainingMs / initialDurationMs))
      : timeRemainingMs > 0
      ? 1
      : 0;
  const strokeDashoffset = circumference * (1 - progress);

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
                  stroke={isRunning ? '#007AFF' : timeRemainingMs > 0 ? '#FF9500' : '#D1D1D6'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
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
                      : timeRemainingMs > 0
                      ? styles.statusBadgePaused
                      : styles.statusBadgeReady,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      isRunning
                        ? styles.statusDotRunning
                        : timeRemainingMs > 0
                        ? styles.statusDotPaused
                        : styles.statusDotReady,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      isRunning
                        ? styles.statusTextRunning
                        : timeRemainingMs > 0
                        ? styles.statusTextPaused
                        : styles.statusTextReady,
                    ]}
                  >
                    {isRunning ? 'RESTING' : timeRemainingMs > 0 ? 'PAUSED' : 'READY'}
                  </Text>
                </View>

                <Text style={styles.timeDisplay}>{formatTime(timeRemainingMs)}</Text>

                {timeRemainingMs > 0 && (
                  <TouchableOpacity
                    style={styles.quickAddPill}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      addTime(30 * 1000);
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome name="plus" size={10} color="#007AFF" />
                    <Text style={styles.quickAddText}>30s</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Controls Row */}
          <View style={styles.controlsRow}>
            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.secondaryBtn, timeRemainingMs === 0 && styles.btnDisabled]}
              onPress={() => {
                if (timeRemainingMs > 0) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  resetTimer();
                }
              }}
              disabled={timeRemainingMs === 0}
              activeOpacity={0.7}
            >
              <FontAwesome
                name="rotate-left"
                size={15}
                color={timeRemainingMs > 0 ? '#FF3B30' : '#C7C7CC'}
              />
              <Text
                style={[
                  styles.secondaryBtnText,
                  timeRemainingMs === 0 && { color: '#C7C7CC' },
                ]}
              >
                Reset
              </Text>
            </TouchableOpacity>

            {/* Primary Action Button */}
            {isRunning ? (
              <TouchableOpacity
                style={[styles.primaryBtn, styles.pauseBtn]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  pauseTimer(timeRemainingMs);
                }}
                activeOpacity={0.8}
              >
                <FontAwesome name="pause" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Pause</Text>
              </TouchableOpacity>
            ) : timeRemainingMs > 0 ? (
              <TouchableOpacity
                style={[styles.primaryBtn, styles.resumeBtn]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  startTimer(timeRemainingMs);
                }}
                activeOpacity={0.8}
              >
                <FontAwesome name="play" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, styles.startBtn]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  startTimer(90 * 1000);
                }}
                activeOpacity={0.8}
              >
                <FontAwesome name="play" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Start (1:30)</Text>
              </TouchableOpacity>
            )}

            {/* Quick +30s Extension */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (timeRemainingMs === 0) {
                  startTimer(30 * 1000);
                } else {
                  addTime(30 * 1000);
                }
              }}
              activeOpacity={0.7}
            >
              <FontAwesome name="plus" size={13} color="#007AFF" />
              <Text style={[styles.secondaryBtnText, { color: '#007AFF' }]}>+30s</Text>
            </TouchableOpacity>
          </View>

          {/* Presets Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <FontAwesome name="bolt" size={13} color="#007AFF" />
              </View>
              <Text style={styles.cardTitle}>Quick Rest Presets</Text>
            </View>

            <View style={styles.presetsGrid}>
              {PRESETS.map((p) => {
                const isSelected = initialDurationMs === p.ms && timeRemainingMs > 0;
                return (
                  <TouchableOpacity
                    key={p.label}
                    style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      startTimer(p.ms);
                    }}
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

          {/* Custom Duration Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <FontAwesome name="clock-o" size={14} color="#007AFF" />
              </View>
              <Text style={styles.cardTitle}>Custom Duration</Text>
            </View>

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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleStartCustom();
                }}
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
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialWrapper: {
    width: 220,
    height: 220,
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
  quickAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 4,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startBtn: {
    backgroundColor: '#007AFF',
  },
  pauseBtn: {
    backgroundColor: '#FF9500',
  },
  resumeBtn: {
    backgroundColor: '#34C759',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  cardIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
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
