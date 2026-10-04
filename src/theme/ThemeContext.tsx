import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { File, Paths } from 'expo-file-system';
import {
  colors,
  ColorTokens,
  spacing,
  radius,
  border,
  typography,
  fonts,
} from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const file = new File(Paths.document, THEME_FILE_NAME);
        if (file.exists) {
          const saved = await file.text();
          const trimmed = saved.trim();
          if (trimmed === 'system' || trimmed === 'light' || trimmed === 'dark') {
            setThemeModeState(trimmed);
          }
        }
      } catch {
        // ignore
      }
    };
    loadTheme();
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

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const currentColors: ColorTokens = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
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
    // Fallback if rendered outside provider
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const systemColorScheme = useColorScheme();
    const isDark = systemColorScheme === 'dark';
    return {
      themeMode: 'system' as ThemeMode,
      setThemeMode: () => {},
      colors: isDark ? colors.dark : colors.light,
      isDark,
      spacing,
      radius,
      border,
      typography,
      fonts,
    };
  }
  return context;
}
