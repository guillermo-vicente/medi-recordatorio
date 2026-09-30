import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MediRecordatorio</Text>
      <Text style={styles.subtitle}>Proyecto en construccion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 15,
    color: '#9E9E9E',
  },
});