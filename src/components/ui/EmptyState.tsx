import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  titleColor?: string;
  subtitleColor?: string;
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  icon,
  color = '#148A83',
  titleColor = '#183A40',
  subtitleColor = '#668087',
}: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
        {icon ? (
          <Ionicons name={icon} size={34} color={color} />
        ) : (
          <Text style={styles.emoji}>{emoji ?? '\u{1F4CB}'}</Text>
        )}
      </View>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 8,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: { fontSize: 40 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
