import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

const timerSoundSource = require('../../assets/sounds/timer-end.wav');
const SOUND_FILE_NAME = 'timer_sound_preference.txt';

interface TimerContextType {
  targetTime: number | null; // epoch timestamp
  isRunning: boolean;
  startTimer: (durationMs: number) => void;
  pauseTimer: (remainingMs: number) => void;
  resetTimer: () => void;
  addTime: (additionalMs: number) => void;
  timeRemainingMs: number;
  initialDurationMs: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playTimerAlert: () => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);
  const [initialDurationMs, setInitialDurationMs] = useState(0);
  const [soundEnabled, setSoundEnabledState] = useState(true);

  const isRunningRef = useRef(isRunning);
  const soundEnabledRef = useRef(soundEnabled);
  const player = useAudioPlayer(timerSoundSource);

  // Load sound preference from file
  useEffect(() => {
    const loadSoundPreference = async () => {
      try {
        const soundFile = new File(Paths.document, SOUND_FILE_NAME);
        if (soundFile.exists) {
          const content = await soundFile.text();
          if (content.trim() === 'false') {
            setSoundEnabledState(false);
          } else if (content.trim() === 'true') {
            setSoundEnabledState(true);
          }
        }
      } catch {
        // ignore
      }
    };
    loadSoundPreference();
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      const soundFile = new File(Paths.document, SOUND_FILE_NAME);
      soundFile.write(enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  // Configure audio session for alert playback
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {
      // ignore if unsupported
    });
  }, []);

  // Update soundEnabledRef
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Manage keep-awake and ref
  useEffect(() => {
    isRunningRef.current = isRunning;
    if (isRunning) {
      activateKeepAwakeAsync('workout_rest_timer');
    } else {
      deactivateKeepAwake('workout_rest_timer');
    }
  }, [isRunning]);

  const playTimerAlert = useCallback(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore if haptics unavailable
    }

    if (soundEnabledRef.current && player) {
      try {
        player.seekTo(0);
        player.play();
      } catch (err) {
        console.warn('Failed to play timer sound', err);
      }
    }
  }, [player]);

  const playTimerAlertRef = useRef(playTimerAlert);
  useEffect(() => {
    playTimerAlertRef.current = playTimerAlert;
  }, [playTimerAlert]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && targetTime !== null) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, targetTime - now);
        setTimeRemainingMs(remaining);

        if (remaining <= 0) {
          setIsRunning(false);
          setTargetTime(null);
          playTimerAlertRef.current();
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, targetTime]);

  const startTimer = (durationMs: number) => {
    setInitialDurationMs(durationMs);
    setTargetTime(Date.now() + durationMs);
    setTimeRemainingMs(durationMs);
    setIsRunning(true);
  };

  const pauseTimer = (remainingMs: number) => {
    setIsRunning(false);
    setTargetTime(null);
    setTimeRemainingMs(remainingMs);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTargetTime(null);
    setTimeRemainingMs(0);
    setInitialDurationMs(0);
  };

  const addTime = (additionalMs: number) => {
    if (isRunningRef.current) {
      setTargetTime((prev) => (prev !== null ? prev + additionalMs : Date.now() + additionalMs));
    }
    setTimeRemainingMs((prev) => prev + additionalMs);
    setInitialDurationMs((prev) => Math.max(prev, prev + additionalMs));
  };

  return (
    <TimerContext.Provider
      value={{
        targetTime,
        isRunning,
        startTimer,
        pauseTimer,
        resetTimer,
        addTime,
        timeRemainingMs,
        initialDurationMs,
        soundEnabled,
        setSoundEnabled,
        playTimerAlert,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}


