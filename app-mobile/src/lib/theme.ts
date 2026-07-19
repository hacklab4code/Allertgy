import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

/** Token HSL allineati a design_guidelines.json (brand violet + lavanda). */
export const THEME = {
  light: {
    background: 'hsl(264 63% 97%)',
    foreground: 'hsl(0 0% 10%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(0 0% 10%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(0 0% 10%)',
    primary: 'hsl(259 43% 25%)',
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(258 74% 86%)',
    secondaryForeground: 'hsl(259 43% 25%)',
    muted: 'hsl(262 67% 98%)',
    mutedForeground: 'hsl(262 7% 43%)',
    accent: 'hsl(258 52% 92%)',
    accentForeground: 'hsl(259 43% 25%)',
    destructive: 'hsl(0 91% 71%)',
    border: 'hsl(259 52% 92%)',
    input: 'hsl(259 52% 92%)',
    ring: 'hsl(259 43% 25%)',
    radius: '0.875rem',
  },
  dark: {
    background: 'hsl(259 43% 12%)',
    foreground: 'hsl(0 0% 98%)',
    card: 'hsl(259 35% 16%)',
    cardForeground: 'hsl(0 0% 98%)',
    popover: 'hsl(259 35% 16%)',
    popoverForeground: 'hsl(0 0% 98%)',
    primary: 'hsl(258 74% 86%)',
    primaryForeground: 'hsl(259 43% 18%)',
    secondary: 'hsl(259 30% 22%)',
    secondaryForeground: 'hsl(0 0% 98%)',
    muted: 'hsl(259 30% 22%)',
    mutedForeground: 'hsl(262 10% 70%)',
    accent: 'hsl(259 30% 22%)',
    accentForeground: 'hsl(0 0% 98%)',
    destructive: 'hsl(0 70% 55%)',
    border: 'hsl(259 25% 24%)',
    input: 'hsl(259 25% 24%)',
    ring: 'hsl(258 74% 86%)',
    radius: '0.875rem',
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
