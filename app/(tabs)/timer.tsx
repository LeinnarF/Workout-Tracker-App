import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useTimer } from '../../src/timer/TimerContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const PRESETS = [
  { label: '1:00', ms: 60 * 1000 },
  { label: '1:30', ms: 90 * 1000 },
  { label: '2:00', ms: 120 * 1000 },
  { label: '3:00', ms: 180 * 1000 },
];

export default function TimerScreen() {
  const { isRunning, timeRemainingMs, startTimer, pauseTimer, resetTimer } = useTimer();
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartCustom = () => {
    const m = parseInt(customMin) || 0;
    const s = parseInt(customSec) || 0;
    const totalMs = (m * 60 + s) * 1000;
    if (totalMs > 0) {
      startTimer(totalMs);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.display}>{formatTime(timeRemainingMs)}</Text>

        <View style={styles.controls}>
          {isRunning ? (
            <TouchableOpacity style={[styles.controlBtn, styles.pauseBtn]} onPress={() => pauseTimer(timeRemainingMs)}>
              <FontAwesome name="pause" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.controlBtn, styles.startBtn]} onPress={() => {
              if (timeRemainingMs > 0) startTimer(timeRemainingMs);
            }}>
              <FontAwesome name="play" size={24} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={resetTimer}>
            <FontAwesome name="stop" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Presets</Text>
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <TouchableOpacity key={p.label} style={styles.presetBtn} onPress={() => startTimer(p.ms)}>
              <Text style={styles.presetText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Custom Timer</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            keyboardType="numeric"
            placeholder="Min"
            value={customMin}
            onChangeText={setCustomMin}
          />
          <Text style={styles.colon}>:</Text>
          <TextInput
            style={styles.customInput}
            keyboardType="numeric"
            placeholder="Sec"
            value={customSec}
            onChangeText={setCustomSec}
          />
          <TouchableOpacity style={styles.customStartBtn} onPress={handleStartCustom}>
            <Text style={styles.customStartText}>Start</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  display: {
    fontSize: 80,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginVertical: 40,
  },
  controls: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 20,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    backgroundColor: '#34C759',
  },
  pauseBtn: {
    backgroundColor: '#FF9500',
  },
  resetBtn: {
    backgroundColor: '#FF3B30',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
    justifyContent: 'center',
  },
  presetBtn: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  presetText: {
    fontSize: 18,
    fontWeight: '500',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 12,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    width: 70,
    textAlign: 'center',
  },
  colon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  customStartBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  customStartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
