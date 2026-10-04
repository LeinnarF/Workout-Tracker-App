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
