import type { UiTheme } from '../types';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  mutedCard: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  info: string;
  text: string;
  textMuted: string;
  border: string;
  warning: string;
  danger: string;
};

export const defaultUiTheme: UiTheme = 'gray';

export const themes: Record<UiTheme, ThemeColors> = {
  light: {
    background: '#f7fbf8',
    surface: '#ffffff',
    surfaceMuted: '#edf7f0',
    mutedCard: '#edf7f0',
    primary: '#16a66a',
    primaryDark: '#087243',
    primarySoft: '#dff6e9',
    accent: '#111827',
    info: '#3b82f6',
    text: '#111827',
    textMuted: '#647067',
    border: '#dbe8df',
    warning: '#d78b00',
    danger: '#c24141',
  },
  gray: {
    background: '#eef1f3',
    surface: '#ffffff',
    surfaceMuted: '#e7ecea',
    mutedCard: '#e7ecea',
    primary: '#16a66a',
    primaryDark: '#087243',
    primarySoft: '#dff6e9',
    accent: '#111827',
    info: '#3b82f6',
    text: '#111827',
    textMuted: '#667085',
    border: '#d6dde1',
    warning: '#f59e0b',
    danger: '#c24141',
  },
};

export const colors = themes[defaultUiTheme];

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};
