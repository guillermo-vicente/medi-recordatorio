// Dialogs cross-platform. Alert.alert con botones no funciona en web.

import { Alert, Platform } from 'react-native';

interface OpcionConfirm {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function showConfirm({
  title,
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
}: OpcionConfirm): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return Promise.resolve(false);
    const texto = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(window.confirm(texto));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message ?? '');
}