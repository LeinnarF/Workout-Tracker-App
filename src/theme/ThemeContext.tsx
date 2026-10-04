import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { File, Paths } from 'expo-file-system';
import {
  ColorTokens,
  spacing,
  radius,
  border,
  typography,
  fonts,
  AccentColor,
  ACCENT_COLORS,
  getThemeColors,
} from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';
export type { AccentColor };

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
  colors: ColorTokens;
  isDark: boolean;
  spacing: typeof spacing;
  radius: typeof radius;
  border: typeof border;
  typography: typeof typography;
  fonts: typeof fonts;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_FILE_NAME = 'theme_preference.txt';
const ACCENT_FILE_NAME = 'accent_preference.txt';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>('green');

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const themeFile = new File(Paths.document, THEME_FILE_NAME);
        if (themeFile.exists) {
          const savedTheme = await themeFile.text();
          const trimmedTheme = savedTheme.trim();
          if (trimmedTheme === 'system' || trimmedTheme === 'light' || trimmedTheme === 'dark') {
            setThemeModeState(trimmedTheme);
          }
        }
      } catch {
        // ignore
      }

      try {
        const accentFile = new File(Paths.document, ACCENT_FILE_NAME);
        if (accentFile.exists) {
          const savedAccent = await accentFile.text();
          const trimmedAccent = savedAccent.trim() as AccentColor;
          if (ACCENT_COLORS.includes(trimmedAccent)) {
            setAccentColorState(trimmedAccent);
          }
        }
      } catch {
        // ignore
      }
    };
    loadPreferences();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      const file = new File(Paths.document, THEME_FILE_NAME);
      await file.write(mode);
    } catch {
      // ignore
    }
  };

  const setAccentColor = async (accent: AccentColor) => {
    setAccentColorState(accent);
    try {
      const file = new File(Paths.document, ACCENT_FILE_NAME);
      await file.write(accent);
    } catch {
      // ignore
    }
  };

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const currentColors: ColorTokens = getThemeColors(isDark, accentColor);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        accentColor,
        setAccentColor,
        colors: currentColors,
        isDark,
        spacing,
        radius,
        border,
        typography,
        fonts,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
