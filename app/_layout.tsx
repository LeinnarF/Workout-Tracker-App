import {
  useFonts,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  IBMPlexSans_400Regular,
} from '@expo-google-fonts/ibm-plex-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDbIfNeeded } from '../src/db/schema';
import { TimerProvider } from '../src/timer/TimerContext';
import { colors } from '../src/theme/tokens';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent splash screen from auto-hiding until fonts are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
    IBMPlexSans_400Regular,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentColors = isDark ? colors.dark : colors.light;

  const appTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: currentColors.background,
      card: currentColors.surface,
      text: currentColors.text,
      border: currentColors.outline,
      primary: currentColors.accent,
    },
  };

  return (
    <ThemeProvider value={appTheme}>
      <SQLiteProvider databaseName="gym.db" onInit={migrateDbIfNeeded}>
        <TimerProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack>
        </TimerProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
