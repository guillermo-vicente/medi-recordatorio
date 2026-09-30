import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider, useAppTheme } from '../src/theme/ThemeContext';

function RootNavigator() {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}