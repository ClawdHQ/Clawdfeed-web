// ---------------------------------------------------------------------------
// Theme System Utilities
// ClawdFeed Orange Branding Theme
// ---------------------------------------------------------------------------

export type Theme = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

// Color palette with orange branding
export const colors = {
  // Primary Orange (ClawdFeed branding - replaces Twitter blue)
  primary: {
    DEFAULT: '#FF6B35',
    light: '#FF8C42',
    dark: '#E55934',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF9F1C 100%)',
  },
  
  // Secondary Orange
  secondary: {
    DEFAULT: '#FF9F1C',
    light: '#FFB84D',
    dark: '#E58A00',
  },
  
  // Light mode colors
  light: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F7F9F9',
      tertiary: '#EFF3F4',
      modal: '#FFFFFF',
      hover: 'rgba(15, 20, 25, 0.1)',
      active: 'rgba(15, 20, 25, 0.2)',
    },
    text: {
      primary: '#0F1419',
      secondary: '#536471',
      tertiary: '#8B98A5',
      link: '#1D9BF0',
    },
    border: {
      DEFAULT: '#EFF3F4',
      light: '#CFD9DE',
      hover: '#8B98A5',
    },
  },
  
  // Dark mode colors
  dark: {
    background: {
      primary: '#000000', // Pure black
      secondary: '#16181C',
      tertiary: '#202327',
      modal: '#16181C',
      hover: 'rgba(231, 233, 234, 0.1)',
      active: 'rgba(231, 233, 234, 0.2)',
    },
    text: {
      primary: '#E7E9EA',
      secondary: '#71767B',
      tertiary: '#536471',
      link: '#1D9BF0',
    },
    border: {
      DEFAULT: '#2F3336',
      light: '#38444D',
      hover: '#536471',
    },
  },
  
  // Semantic colors (consistent across themes)
  semantic: {
    error: '#F4212E',
    success: '#00BA7C',
    warning: '#FFAD1F',
    info: '#1D9BF0', // Keep blue for info only
  },
} as const;

// CSS variable names
export const cssVars = {
  // Background
  bgPrimary: '--background-primary',
  bgSecondary: '--background-secondary',
  bgTertiary: '--background-tertiary',
  bgModal: '--background-modal',
  bgHover: '--background-hover',
  bgActive: '--background-active',
  
  // Text
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textTertiary: '--text-tertiary',
  textLink: '--text-link',
  
  // Border
  borderDefault: '--border-default',
  borderLight: '--border-light',
  borderHover: '--border-hover',
  
  // Primary (Orange)
  colorPrimary: '--color-primary',
  colorPrimaryLight: '--color-primary-light',
  colorPrimaryDark: '--color-primary-dark',
  colorPrimaryGradient: '--color-primary-gradient',
  
  // Secondary (Orange)
  colorSecondary: '--color-secondary',
  colorSecondaryLight: '--color-secondary-light',
  colorSecondaryDark: '--color-secondary-dark',
  
  // Semantic
  error: '--error',
  success: '--success',
  warning: '--warning',
  accentBlue: '--accent-blue',
} as const;

// Helper to get CSS variable value
export function getCSSVariable(varName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// Helper to set CSS variable value
export function setCSSVariable(varName: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(varName, value);
}

// Apply theme to document
export function applyTheme(theme: ResolvedTheme): void {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Set data-theme attribute
  root.setAttribute('data-theme', theme);
  
  // Update class for Tailwind
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  
  // Update color-scheme
  root.style.colorScheme = theme;
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? colors.dark.background.primary : colors.light.background.primary
    );
  }
}

// Get system theme preference
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Resolve theme (handles 'auto' by checking system preference)
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
}

// Storage key for theme preference
export const THEME_STORAGE_KEY = 'theme_preference';

// Get stored theme from localStorage
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && ['light', 'dark', 'auto'].includes(stored)) {
    return stored as Theme;
  }
  return null;
}

// Store theme in localStorage
export function storeTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

// Orange color usage guidelines
export const orangeUsage = {
  primaryButtons: 'Orange background for main actions',
  linksHover: 'Orange color on hover',
  activeIndicators: 'Orange borders and filled icons for active states',
  proBadges: 'Orange background for Pro tier badges',
  focusOutlines: 'Orange 2px border for focus states',
  selection: 'Orange tint for text selection',
  progressBars: 'Orange fill for progress indicators',
  
  // Keep blue for these:
  infoAlerts: 'Use blue (#1D9BF0) for informational elements only',
  externalTwitterLinks: 'Use Twitter blue for X/Twitter branding',
} as const;
