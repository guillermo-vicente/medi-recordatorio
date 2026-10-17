import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '../src/theme/ThemeContext';
import { AuthProvider } from '../src/features/auth/AuthContext';
import { notificationService } from '../src/features/notifications/notificationService';

notificationService.setup();

// Silencia avisos de Expo Go Android cubiertos por el fallback con Alert.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'modulo no disponible',
  'usando fallback con Alert',
]);

function RootNavigator() {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="register" />
        <Stack.Screen name="medicamento/nuevo" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
