// Provee el tema claro/oscuro y sincroniza React Native Paper con los colores de la app.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    setIsDark(systemScheme === 'dark');
  }, [systemScheme]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const paperTheme = useMemo(
    () =>
      isDark
        ? {
            ...MD3DarkTheme,
            colors: {
              ...MD3DarkTheme.colors,
              primary: '#bb86fc',
              secondary: '#03dac6',
            },
          }
        : {
            ...MD3LightTheme,
            colors: {
              ...MD3LightTheme.colors,
              primary: '#6C63FF',
              secondary: '#03dac6',
            },
          },
    [isDark]
  );

  const contextValue = useMemo(() => ({ isDark, toggleTheme }), [isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}