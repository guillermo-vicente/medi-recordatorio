import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface Props {
  eyebrow?: string;
  title: string;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({ eyebrow = 'MEDIRECORDATORIO', title, style }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.banner }, style]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.76)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    color: '#FFFFFF',
  },
});
