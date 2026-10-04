import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTimer } from '../../src/timer/TimerContext';

const MINUTES_DATA = Array.from({ length: 16 }, (_, i) => i); // 0 to 15
const SECONDS_DATA = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const PRESETS = [
  { label: '30s', min: 0, sec: 30, ms: 30 * 1000 },
  { label: '1:00', min: 1, sec: 0, ms: 60 * 1000 },
  { label: '1:30', min: 1, sec: 30, ms: 90 * 1000 },
  { label: '2:00', min: 2, sec: 0, ms: 120 * 1000 },
  { label: '2:30', min: 2, sec: 30, ms: 150 * 1000 },
  { label: '3:00', min: 3, sec: 0, ms: 180 * 1000 },
];

const ITEM_HEIGHT = 54;
const VISIBLE_COUNT = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const PADDING = (PICKER_HEIGHT - ITEM_HEIGHT) / 2; // exactly 1 item height above & below

interface OdometerWheelProps {
  items: number[];
  selectedValue: number;
  onValueChange: (val: number) => void;
  unitLabel: string;
}

function OdometerWheel({
  items,
  selectedValue,
  onValueChange,
  unitLabel,
}: OdometerWheelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isUserScrollingRef = useRef(false);

  const isFirstMount = useRef(true);

  // Sync scroll position when selectedValue changes externally (e.g. presets)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      const initialIdx = items.indexOf(selectedValue);
      if (initialIdx !== -1) {
        scrollRef.current?.scrollTo({
          y: initialIdx * ITEM_HEIGHT,
          animated: false,
        });
      }
      return;
    }

    if (!isUserScrollingRef.current) {
      const targetIndex = items.indexOf(selectedValue);
      if (targetIndex !== -1) {
        scrollRef.current?.scrollTo({
          y: targetIndex * ITEM_HEIGHT,
          animated: true,
        });
      }
    }
  }, [selectedValue, items]);

  const handleScrollBegin = () => {
    isUserScrollingRef.current = true;
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrollingRef.current = false;
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_HEIGHT)));
    const newValue = items[index];
    if (newValue !== selectedValue) {
      try {
        Haptics.selectionAsync();
      } catch {
        // ignore
      }
      onValueChange(newValue);
    }
  };

  return (
    <View style={styles.wheelColumn}>
      {/* Unit label above wheel */}
      <Text style={styles.wheelHeaderLabel}>{unitLabel.toUpperCase()}</Text>

      <View style={styles.wheelWindow}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="center"
          decelerationRate="fast"
          nestedScrollEnabled={true}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={{
            paddingVertical: PADDING,
          }}
        >
          {items.map((item, index) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                key={item}
                style={styles.wheelItem}
                activeOpacity={0.7}
                onPress={() => {
                  scrollRef.current?.scrollTo({
                    y: index * ITEM_HEIGHT,
                    animated: true,
                  });
                  if (item !== selectedValue) {
                    try {
                      Haptics.selectionAsync();
                    } catch {
                      // ignore
                    }
                    onValueChange(item);
                  }
                }}
              >
                <Text
                  style={[
                    styles.wheelItemText,
                    isSelected && styles.wheelItemTextSelected,
                  ]}
                >
                  {item.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Top Fade Gradient Mask */}
        <View style={styles.fadeMaskTop} pointerEvents="none" />

        {/* Bottom Fade Gradient Mask */}
        <View style={styles.fadeMaskBottom} pointerEvents="none" />
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

  // Odometer selection states, defaulting to 1:30
  const [selectedMin, setSelectedMin] = useState(1);
  const [selectedSec, setSelectedSec] = useState(30);

  const totalSelectedSeconds = selectedMin * 60 + selectedSec;

  const formatCountdown = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (totalSelectedSeconds > 0) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // ignore
      }
      startTimer(totalSelectedSeconds * 1000);
    }
  };

  const handlePresetSelect = (min: number, sec: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    setSelectedMin(min);
    setSelectedSec(sec);
  };

  // Dial calculations for active countdown mode
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
              {/* Reset Button (stops timer and returns to odometer picker) */}
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
              <Text style={styles.adjustLinkText}>Change Rest Duration</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ======================================================== */
          /* DEFAULT STATE: Odometer Scrolling Number Wheels          */
          /* ======================================================== */
          <>
            {/* Header Badge */}
            <View style={styles.headerDisplayContainer}>
              <View style={styles.badgePill}>
                <FontAwesome name="hourglass-half" size={11} color="#007AFF" />
                <Text style={styles.badgeText}>REST TIMER</Text>
              </View>
              <Text style={styles.odometerSubtitle}>
                Scroll to select duration
              </Text>
            </View>

            {/* Odometer Drum Container */}
            <View style={styles.odometerCard}>
              {/* Highlight selection bar sitting behind center row */}
              <View style={styles.odometerSelectionBar} pointerEvents="none">
                <Text style={styles.selectionUnitMin}>min</Text>
                <Text style={styles.selectionUnitSec}>sec</Text>
              </View>

              <View style={styles.odometerWheelsRow}>
                {/* Minutes Drum Wheel */}
                <OdometerWheel
                  items={MINUTES_DATA}
                  selectedValue={selectedMin}
                  onValueChange={setSelectedMin}
                  unitLabel="Minutes"
                />

                {/* Center Colon Separator */}
                <View style={styles.colonContainer} pointerEvents="none">
                  <Text style={styles.colonText}>:</Text>
                </View>

                {/* Seconds Drum Wheel */}
                <OdometerWheel
                  items={SECONDS_DATA}
                  selectedValue={selectedSec}
                  onValueChange={setSelectedSec}
                  unitLabel="Seconds"
                />
              </View>
            </View>

            {/* Quick Presets */}
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
                    selectedMin === p.min && selectedSec === p.sec;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[
                        styles.presetBtn,
                        isSelected && styles.presetBtnActive,
                      ]}
                      onPress={() => handlePresetSelect(p.min, p.sec)}
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

            {/* Start Timer CTA Button */}
            <TouchableOpacity
              style={[
                styles.startCtaBtn,
                totalSelectedSeconds === 0 && styles.startCtaBtnDisabled,
              ]}
              onPress={handleStart}
              disabled={totalSelectedSeconds === 0}
              activeOpacity={0.8}
            >
              <FontAwesome
                name="play"
                size={18}
                color="#fff"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.startCtaBtnText}>
                {totalSelectedSeconds > 0
                  ? `Start Rest (${selectedMin.toString().padStart(2, '0')}:${selectedSec.toString().padStart(2, '0')})`
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
    marginBottom: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.8,
  },
  odometerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  odometerCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  odometerSelectionBar: {
    position: 'absolute',
    top: PADDING + 34, // account for wheel header labels
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D0DBEA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    zIndex: 1,
  },
  selectionUnitMin: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    position: 'absolute',
    left: '42%',
  },
  selectionUnitSec: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    position: 'absolute',
    right: 14,
  },
  odometerWheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 2,
  },
  wheelColumn: {
    flex: 1,
    alignItems: 'center',
  },
  wheelHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  wheelWindow: {
    height: PICKER_HEIGHT,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontSize: 26,
    fontWeight: '500',
    color: '#AEAEB2',
    fontVariant: ['tabular-nums'],
    opacity: 0.45,
  },
  wheelItemTextSelected: {
    fontSize: 44,
    fontWeight: '800',
    color: '#1C1C1E',
    opacity: 1,
  },
  colonContainer: {
    width: 24,
    height: PICKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  colonText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  fadeMaskTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PADDING,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  fadeMaskBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PADDING,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  startCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 6,
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
