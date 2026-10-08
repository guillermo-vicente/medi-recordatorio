import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface Props {
  message?: string;
  color?: string;
  textColor?: string;
}

export function LoadingState({
  message = 'Cargando...',
  color = '#148A83',
  textColor = '#668087',
}: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
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
    fontWeight: '500',
  },
});
