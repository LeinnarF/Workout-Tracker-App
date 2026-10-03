import React, { createContext, useContext, useState, useEffect } from 'react';
import { useKeepAwake } from 'expo-keep-awake';

interface TimerContextType {
  targetTime: number | null; // epoch timestamp
  isRunning: boolean;
  startTimer: (durationMs: number) => void;
  pauseTimer: (remainingMs: number) => void;
  resetTimer: () => void;
  timeRemainingMs: number;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);

  // Keep screen awake while timer is running
  if (isRunning) {
    // We can conditionally call hooks here if we use a component or just handle it. 
    // Wait, useKeepAwake() must be called at top level or unconditionally.
    // Let's use a wrapper component for keep awake.
  }

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
          // TODO: Trigger haptic alert
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, targetTime]);

  const startTimer = (durationMs: number) => {
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
  };

  return (
    <TimerContext.Provider value={{ targetTime, isRunning, startTimer, pauseTimer, resetTimer, timeRemainingMs }}>
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
