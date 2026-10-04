import { useColorScheme } from 'react-native';
import { colors, ColorTokens, spacing, radius, border, typography, fonts } from './tokens';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const currentColors: ColorTokens = isDark ? colors.dark : colors.light;

  return {
    colors: currentColors,
    isDark,
    spacing,
    radius,
    border,
    typography,
    fonts,
  };
}
