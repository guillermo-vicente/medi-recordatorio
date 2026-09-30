import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface Props {
  message?: string;
  color?: string;
}

export function LoadingState({
  message = 'Cargando...',
  color = '#6C63FF',
}: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
  },
});