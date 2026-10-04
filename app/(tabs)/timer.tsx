import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  PanResponder,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTimer } from '../../src/timer/TimerContext';

const PRESETS = [
  { label: '30s', min: 0, sec: 30, ms: 30 * 1000 },
  { label: '1:00', min: 1, sec: 0, ms: 60 * 1000 },
  { label: '1:30', min: 1, sec: 30, ms: 90 * 1000 },
  { label: '2:00', min: 2, sec: 0, ms: 120 * 1000 },
  { label: '2:30', min: 2, sec: 30, ms: 150 * 1000 },
  { label: '3:00', min: 3, sec: 0, ms: 180 * 1000 },
];

const MINUTE_TICKS = [
  { value: 0, label: '0m' },
  { value: 2, label: '2m' },
  { value: 4, label: '4m' },
  { value: 6, label: '6m' },
  { value: 8, label: '8m' },
  { value: 10, label: '10m' },
];

const SECOND_TICKS = [
  { value: 0, label: '0s' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 55, label: '55s' },
];

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  ticks: { value: number; label: string }[];
  onChange: (val: number) => void;
}

function TimeNumberSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  ticks,
  onChange,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const updateFromPosition = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const ratio = Math.max(0, Math.min(1, x / trackWidth));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      if (clamped !== value) {
        try {
          Haptics.selectionAsync();
        } catch {
          // ignore
        }
        onChange(clamped);
      }
    },
    [trackWidth, min, max, step, value, onChange]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          updateFromPosition(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          updateFromPosition(evt.nativeEvent.locationX);
        },
      }),
    [updateFromPosition]
  );

  const progress = max > min ? (value - min) / (max - min) : 0;
  const fillWidth = trackWidth * progress;
  const thumbLeft = Math.max(0, Math.min(trackWidth - 24, fillWidth - 12));

  return (
    <View style={styles.sliderCard}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <View style={styles.valueBadge}>
          <Text style={styles.valueBadgeText}>
            {value} {unit}
          </Text>
        </View>
      </View>

      <View style={styles.sliderRow}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => {
            const next = Math.max(min, value - step);
            if (next !== value) {
              try {
                Haptics.selectionAsync();
              } catch {
                // ignore
              }
              onChange(next);
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <FontAwesome name="minus" size={12} color="#007AFF" />
        </TouchableOpacity>

        <View
          style={styles.trackContainer}
          {...panResponder.panHandlers}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.trackBackground} pointerEvents="none">
            <View style={[styles.trackFill, { width: fillWidth }]} />
            <View style={[styles.thumb, { left: thumbLeft }]} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => {
            const next = Math.min(max, value + step);
            if (next !== value) {
              try {
                Haptics.selectionAsync();
              } catch {
                // ignore
              }
              onChange(next);
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <FontAwesome name="plus" size={12} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.ticksRow}>
        {ticks.map((t) => (
          <TouchableOpacity
            key={t.value}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {
                // ignore
              }
              onChange(t.value);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text
              style={[
                styles.tickText,
                value === t.value && styles.tickTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

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

  // Slider state defaults to 1:30 (1 min, 30 sec)
  const [sliderMin, setSliderMin] = useState(1);
  const [sliderSec, setSliderSec] = useState(30);

  const formatCountdown = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalAdjustedSeconds = sliderMin * 60 + sliderSec;

  const handleStartFromSlider = () => {
    if (totalAdjustedSeconds > 0) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // ignore
      }
      startTimer(totalAdjustedSeconds * 1000);
    }
  };

  const handleApplyPreset = (min: number, sec: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    setSliderMin(min);
    setSliderSec(sec);
  };

  // Dial calculations for active progress mode
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

  const isTimerActive = isRunning || timeRemainingMs > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {isTimerActive ? (
          /* ======================================================== */
          /* ACTIVE STATE: Circle Timer Progress Dial                 */
          /* ======================================================== */
          <>
            <View style={styles.dialContainer}>
              <View style={styles.dialWrapper}>
                <Svg width={size} height={size} style={styles.svgRing}>
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E9EBF0"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={isRunning ? '#007AFF' : '#FF9500'}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                  />
                </Svg>

                <View style={styles.dialContent}>
                  <View
                    style={[
                      styles.statusBadge,
                      isRunning
                        ? styles.statusBadgeRunning
                        : styles.statusBadgePaused,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        isRunning
                          ? styles.statusDotRunning
                          : styles.statusDotPaused,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        isRunning
                          ? styles.statusTextRunning
                          : styles.statusTextPaused,
                      ]}
                    >
                      {isRunning ? 'RESTING' : 'PAUSED'}
                    </Text>
                  </View>

                  <Text style={styles.timeDisplay}>
                    {formatCountdown(timeRemainingMs)}
                  </Text>

                  <TouchableOpacity
                    style={styles.quickAddPill}
                    onPress={() => {
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch {
                        // ignore
                      }
                      addTime(30 * 1000);
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome name="plus" size={10} color="#007AFF" />
                    <Text style={styles.quickAddText}>30s</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Controls Row */}
            <View style={styles.controlsRow}>
              {/* Reset Button (returns back to slider view) */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {
                    // ignore
                  }
                  resetTimer();
                }}
                activeOpacity={0.7}
              >
                <FontAwesome name="rotate-left" size={15} color="#FF3B30" />
                <Text style={styles.secondaryBtnText}>Reset</Text>
              </TouchableOpacity>

              {/* Pause / Resume Button */}
              {isRunning ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.pauseBtn]}
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
                  <FontAwesome
                    name="pause"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryBtnText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.resumeBtn]}
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
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryBtnText}>Resume</Text>
                </TouchableOpacity>
              )}

              {/* Quick +30s Extension */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {
                    // ignore
                  }
                  addTime(30 * 1000);
                }}
                activeOpacity={0.7}
              >
                <FontAwesome name="plus" size={13} color="#007AFF" />
                <Text style={[styles.secondaryBtnText, { color: '#007AFF' }]}>
                  +30s
                </Text>
              </TouchableOpacity>
            </View>

            {/* Adjust Duration Link */}
            <TouchableOpacity
              style={styles.adjustLink}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                  // ignore
                }
                resetTimer();
              }}
              activeOpacity={0.7}
            >
              <FontAwesome name="sliders" size={13} color="#8E8E93" />
              <Text style={styles.adjustLinkText}>Change Duration Slider</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ======================================================== */
          /* DEFAULT STATE: Time Adjuster Number Sliders              */
          /* ======================================================== */
          <>
            {/* Header Display */}
            <View style={styles.headerDisplayContainer}>
              <View style={styles.badgePill}>
                <FontAwesome name="hourglass-half" size={11} color="#007AFF" />
                <Text style={styles.badgeText}>SET REST DURATION</Text>
              </View>

              <Text style={styles.sliderTimeBig}>
                {sliderMin}:{sliderSec.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.sliderTimeSub}>
                {sliderMin > 0 ? `${sliderMin} min ` : ''}
                {sliderSec > 0 ? `${sliderSec} sec` : sliderMin === 0 ? '0 sec' : ''}
              </Text>
            </View>

            {/* Minutes Slider Card */}
            <TimeNumberSlider
              label="MINUTES"
              value={sliderMin}
              min={0}
              max={10}
              step={1}
              unit="min"
              ticks={MINUTE_TICKS}
              onChange={setSliderMin}
            />

            {/* Seconds Slider Card */}
            <TimeNumberSlider
              label="SECONDS"
              value={sliderSec}
              min={0}
              max={55}
              step={5}
              unit="sec"
              ticks={SECOND_TICKS}
              onChange={setSliderSec}
            />

            {/* Presets Row */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <FontAwesome name="bolt" size={13} color="#007AFF" />
                </View>
                <Text style={styles.cardTitle}>Quick Presets</Text>
              </View>

              <View style={styles.presetsGrid}>
                {PRESETS.map((p) => {
                  const isSelected =
                    sliderMin === p.min && sliderSec === p.sec;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[
                        styles.presetBtn,
                        isSelected && styles.presetBtnActive,
                      ]}
                      onPress={() => handleApplyPreset(p.min, p.sec)}
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

            {/* Start Timer CTA */}
            <TouchableOpacity
              style={[
                styles.startCtaBtn,
                totalAdjustedSeconds === 0 && styles.startCtaBtnDisabled,
              ]}
              onPress={handleStartFromSlider}
              disabled={totalAdjustedSeconds === 0}
              activeOpacity={0.8}
            >
              <FontAwesome
                name="play"
                size={18}
                color="#fff"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.startCtaBtnText}>
                {totalAdjustedSeconds > 0
                  ? `Start Rest (${sliderMin}:${sliderSec.toString().padStart(2, '0')})`
                  : 'Select Duration'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  headerDisplayContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  sliderTimeBig: {
    fontSize: 58,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    color: '#1C1C1E',
    letterSpacing: -1,
  },
  sliderTimeSub: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2,
  },
  sliderCard: {
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
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
  },
  valueBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  valueBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackContainer: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 8,
    backgroundColor: '#E9EBF0',
    borderRadius: 4,
    position: 'relative',
  },
  trackFill: {
    height: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  ticksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    marginTop: 8,
  },
  tickText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C7C7CC',
  },
  tickTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  startCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startCtaBtnDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  startCtaBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
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
  adjustLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  adjustLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
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
    fontSize: 14,
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
    backgroundColor: '#EFF6FF',
    borderColor: '#007AFF',
  },
  presetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  presetBtnTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
});
