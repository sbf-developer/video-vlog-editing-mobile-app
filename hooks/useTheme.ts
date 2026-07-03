import { useMemo } from 'react';

import { fonts } from '@/constants/fonts';
import { useColorScheme } from '@/components/useColorScheme';
import { theme, type ThemeColors } from '@/constants/theme';

function withFonts<T extends Record<string, object>>(styles: T, familyMap: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(styles).map(([key, style]) => [
      key,
      { ...style, fontFamily: familyMap[key] ?? fonts.regular },
    ]),
  ) as { [K in keyof T]: T[K] & { fontFamily: string } };
}

const fontMap = {
  title: fonts.semiBold,
  heading: fonts.semiBold,
  body: fonts.regular,
  caption: fonts.regular,
  label: fonts.medium,
  button: fonts.medium,
  buttonSm: fonts.medium,
};

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? theme.dark : theme.light;
}

export function useThemeWithSpacing() {
  const colors = useTheme();
  const typography = useMemo(() => withFonts(theme.typography, fontMap), []);

  return { colors, spacing: theme.spacing, radius: theme.radius, typography };
}
