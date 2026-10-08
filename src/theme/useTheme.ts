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
    onPrimary: string;
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
      bg: isDark ? '#102326' : '#F2F8F7',
      card: isDark ? '#183237' : '#FFFFFF',
      text: isDark ? '#EFF8F6' : '#183A40',
      subtext: isDark ? '#A0BCB8' : '#668087',
      border: isDark ? '#2D4C50' : '#DDEAE7',
      primary: isDark ? '#55C7B3' : '#0F766E',
      onPrimary: isDark ? '#102326' : '#FFFFFF',
      danger: isDark ? '#FF858B' : '#C84C59',
      warning: isDark ? '#F3C969' : '#B7791F',
      success: isDark ? '#66C99E' : '#27866D',
      banner: isDark ? '#214E4A' : '#0F766E',
      overlay: 'rgba(0,0,0,0.4)',
    },
  };
}
