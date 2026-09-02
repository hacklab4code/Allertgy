import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

/** Token HSL allineati a design_guidelines.json (Cosmic #23212C + Vanilla #F1FEC8). */
export const THEME = {
  light: {
    background: 'hsl(210 40% 98%)',
    foreground: 'hsl(250 16% 15%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(250 16% 15%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(250 16% 15%)',
    primary: 'hsl(250 16% 15%)',
    primaryForeground: 'hsl(74 97% 89%)',
    secondary: 'hsl(74 97% 89%)',
    secondaryForeground: 'hsl(250 16% 15%)',
    muted: 'hsl(210 40% 96%)',
    mutedForeground: 'hsl(215 16% 47%)',
    accent: 'hsl(74 97% 89%)',
    accentForeground: 'hsl(250 16% 15%)',
    destructive: 'hsl(0 84% 60%)',
    border: 'hsl(214 32% 91%)',
    input: 'hsl(214 32% 91%)',
    ring: 'hsl(250 16% 15%)',
    radius: '1rem',
  },
  dark: {
    background: 'hsl(250 16% 10%)',
    foreground: 'hsl(0 0% 98%)',
    card: 'hsl(250 16% 15%)',
    cardForeground: 'hsl(0 0% 98%)',
    popover: 'hsl(250 16% 15%)',
    popoverForeground: 'hsl(0 0% 98%)',
    primary: 'hsl(74 97% 89%)',
    primaryForeground: 'hsl(250 16% 15%)',
    secondary: 'hsl(250 14% 22%)',
    secondaryForeground: 'hsl(0 0% 98%)',
    muted: 'hsl(250 14% 20%)',
    mutedForeground: 'hsl(250 10% 70%)',
    accent: 'hsl(74 97% 89%)',
    accentForeground: 'hsl(250 16% 15%)',
    destructive: 'hsl(0 70% 55%)',
    border: 'hsl(250 14% 22%)',
    input: 'hsl(250 14% 22%)',
    ring: 'hsl(74 97% 89%)',
    radius: '1rem',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
