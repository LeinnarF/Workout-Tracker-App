export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  none: 0,
  control: 2,
};

export const border = {
  width: 1,
  focus: 2,
};

export const colors = {
  light: {
    background: '#F6F6F3',
    surface: '#FFFFFF',
    raised: '#ECECE7',
    outline: '#DADAD3',
    text: '#141412',
    textMuted: '#5F5F58',
    accent: '#2F7D32',
    accentTint: '#E3EFE0',
    onAccent: '#FFFFFF',
  },
  dark: {
    background: '#0E0F0D',
    surface: '#171916',
    raised: '#222421',
    outline: '#31342F',
    text: '#F1F2EE',
    textMuted: '#9A9D95',
    accent: '#B6F24A',
    accentTint: '#232E10',
    onAccent: '#10140A',
  },
};

export type ColorTokens = typeof colors.light;

export type AccentColor =
  | 'green'
  | 'cyan'
  | 'yellow'
  | 'magenta'
  | 'red'
  | 'pink'
  | 'orange'
  | 'blue';

export const ACCENT_COLORS: AccentColor[] = [
  'green',
  'cyan',
  'yellow',
  'magenta',
  'red',
  'pink',
  'orange',
  'blue',
];

export const accentPalettes: Record<
  AccentColor,
  {
    name: string;
    light: { accent: string; accentTint: string; onAccent: string };
    dark: { accent: string; accentTint: string; onAccent: string };
  }
> = {
  green: {
    name: 'GREEN',
    light: { accent: '#2F7D32', accentTint: '#E4F0E2', onAccent: '#FFFFFF' },
    dark: { accent: '#B6F24A', accentTint: '#232E10', onAccent: '#10140A' },
  },
  cyan: {
    name: 'CYAN',
    light: { accent: '#00838F', accentTint: '#E0F4F7', onAccent: '#FFFFFF' },
    dark: { accent: '#00E5FF', accentTint: '#0A2B33', onAccent: '#081417' },
  },
  yellow: {
    name: 'YELLOW',
    light: { accent: '#A67C00', accentTint: '#FFF8E1', onAccent: '#FFFFFF' },
    dark: { accent: '#FFE600', accentTint: '#332D05', onAccent: '#1A1702' },
  },
  magenta: {
    name: 'MAGENTA',
    light: { accent: '#9D174D', accentTint: '#FDF2F8', onAccent: '#FFFFFF' },
    dark: { accent: '#F43F9E', accentTint: '#330D26', onAccent: '#1A0413' },
  },
  red: {
    name: 'RED',
    light: { accent: '#C62828', accentTint: '#FFEBEE', onAccent: '#FFFFFF' },
    dark: { accent: '#FF5252', accentTint: '#331111', onAccent: '#1A0505' },
  },
  pink: {
    name: 'PINK',
    light: { accent: '#BE185D', accentTint: '#FCE7F3', onAccent: '#FFFFFF' },
    dark: { accent: '#FF60A8', accentTint: '#331221', onAccent: '#1A050F' },
  },
  orange: {
    name: 'ORANGE',
    light: { accent: '#C2410C', accentTint: '#FFF3E0', onAccent: '#FFFFFF' },
    dark: { accent: '#FF7A1A', accentTint: '#331805', onAccent: '#1A0C02' },
  },
  blue: {
    name: 'BLUE',
    light: { accent: '#1D4ED8', accentTint: '#EFF6FF', onAccent: '#FFFFFF' },
    dark: { accent: '#38BDF8', accentTint: '#0E1E38', onAccent: '#070F1C' },
  },
};

export function getThemeColors(isDark: boolean, accent: AccentColor = 'green'): ColorTokens {
  const base = isDark ? colors.dark : colors.light;
  const palette = accentPalettes[accent] || accentPalettes.green;
  const accentTokens = isDark ? palette.dark : palette.light;
  return {
    ...base,
    ...accentTokens,
  };
}

export const fonts = {
  monoRegular: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_700Bold',
  sansRegular: 'IBMPlexSans_400Regular',
};

export const typography = {
  display: {
    fontFamily: fonts.monoBold,
    fontSize: 70,
    lineHeight: 52,
    fontWeight: '700' as const,
  },
  numeral: {
    fontFamily: fonts.monoMedium,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '500' as const,
  },
  title: {
    fontFamily: fonts.monoMedium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.8,
  },
  micro: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.8,
  },
};
