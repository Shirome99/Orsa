/**
 * Design tokens. Soft, low-contrast surfaces with a muted plum accent; dedicated
 * colors for cycle phases so the calendar and Today screen stay consistent.
 */

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  success: string;
  period: string;
  periodSoft: string;
  fertile: string;
  fertileSoft: string;
  ovulation: string;
  luteal: string;
  focus: string;
}

export const lightColors: ColorPalette = {
  background: '#FBF8F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F4EEF0',
  border: '#E9E0E4',
  text: '#2D2630',
  textMuted: '#6F6573',
  primary: '#9B4F74',
  primarySoft: '#F3E4EB',
  onPrimary: '#FFFFFF',
  danger: '#B3413F',
  success: '#3F7D63',
  period: '#C4506E',
  periodSoft: '#F7DCE3',
  fertile: '#4E8C7A',
  fertileSoft: '#DDEEE8',
  ovulation: '#2F7A65',
  luteal: '#8C7AB0',
  focus: '#9B4F74',
};

export const darkColors: ColorPalette = {
  background: '#16131A',
  surface: '#211C25',
  surfaceMuted: '#2B2530',
  border: '#3A3240',
  text: '#F3EDF2',
  textMuted: '#AFA4B2',
  primary: '#E39BBC',
  primarySoft: '#432D3A',
  onPrimary: '#2A1520',
  danger: '#EE8C88',
  success: '#86C7A9',
  period: '#EC8AA3',
  periodSoft: '#4A2632',
  fertile: '#86C7B2',
  fertileSoft: '#213A33',
  ovulation: '#A7DDC9',
  luteal: '#BCAEE0',
  focus: '#E39BBC',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Maximum width of the main content column on large screens (readability). */
export const CONTENT_MAX_WIDTH = 880;

export interface Theme {
  dark: boolean;
  colors: ColorPalette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

export function buildTheme(dark: boolean): Theme {
  return { dark, colors: dark ? darkColors : lightColors, spacing, radius, typography };
}
