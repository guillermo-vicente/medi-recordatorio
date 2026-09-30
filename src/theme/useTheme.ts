import { useAppTheme } from './ThemeContext';

export interface AppTheme {
  isDark: boolean;
  colors: {
    bg: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
    danger: string;
    warning: string;
    success: string;
    banner: string;
    overlay: string;
  };
}

export function useTheme(): AppTheme {
  const { isDark } = useAppTheme();

  return {
    isDark,
    colors: {
      bg: isDark ? '#1A1A2E' : '#F8F7FF',
      card: isDark ? '#2B2B42' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#1A1A2E',
      subtext: isDark ? '#A5A5BA' : '#9E9E9E',
      border: isDark ? '#3E3E5A' : '#F0F0F0',
      primary: '#6C63FF',
      danger: '#FF6584',
      warning: '#F7B731',
      success: '#20BF6B',
      banner: isDark ? '#5046E5' : '#6C63FF',
      overlay: 'rgba(0,0,0,0.4)',
    },
  };
}