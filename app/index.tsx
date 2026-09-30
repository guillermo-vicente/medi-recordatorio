import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../src/theme/useTheme';

export default function Index() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        MediRecordatorio
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
        Proyecto en construccion
      </Text>
      <Text style={[styles.hint, { color: theme.colors.subtext }]}>
        Modo actual: {theme.isDark ? 'oscuro' : 'claro'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    marginTop: 20,
  },
});