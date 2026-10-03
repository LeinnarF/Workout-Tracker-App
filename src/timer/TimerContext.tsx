import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';

interface TimerContextType {
  targetTime: number | null; // epoch timestamp
  isRunning: boolean;
  startTimer: (durationMs: number) => void;
  pauseTimer: (remainingMs: number) => void;
  resetTimer: () => void;
  addTime: (additionalMs: number) => void;
  timeRemainingMs: number;
  initialDurationMs: number;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);
  const [initialDurationMs, setInitialDurationMs] = useState(0);
  const isRunningRef = useRef(isRunning);

  // Manage keep-awake and ref
  useEffect(() => {
    isRunningRef.current = isRunning;
    if (isRunning) {
      activateKeepAwakeAsync('workout_rest_timer');
    } else {
      deactivateKeepAwake('workout_rest_timer');
    }
  }, [isRunning]);

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
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            // ignore if haptics unavailable
          }
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
    setTimeRemainingMs((prev) => {
      const next = prev + additionalMs;
      if (isRunningRef.current) {
        setTargetTime(Date.now() + next);
      }
      return next;
    });
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

