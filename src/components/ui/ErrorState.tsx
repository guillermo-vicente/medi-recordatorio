import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  message: string;
  onRetry?: () => void;
  color?: string;
  dangerColor?: string;
  actionTextColor?: string;
  textColor?: string;
  mutedColor?: string;
}

export function ErrorState({
  message,
  onRetry,
  color = '#0F766E',
  dangerColor = '#C84C59',
  actionTextColor = '#FFFFFF',
  textColor = '#183A40',
  mutedColor = '#668087',
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={52} color={dangerColor} />
      <Text style={[styles.title, { color: textColor }]}>Algo salió mal</Text>
      <Text style={[styles.message, { color: mutedColor }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: color }]}
          onPress={onRetry}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Reintentar carga"
        >
          <Ionicons name="refresh-outline" size={18} color={actionTextColor} />
          <Text style={[styles.retryText, { color: actionTextColor }]}>Reintentar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: '700' },
  message: { fontSize: 14, textAlign: 'center' },
  retryBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
  },
  retryText: { fontWeight: '700', fontSize: 15 },
});
