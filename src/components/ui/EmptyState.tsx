import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  titleColor?: string;
  subtitleColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionAccessibilityLabel?: string;
  actionTextColor?: string;
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  icon,
  color = '#0F766E',
  titleColor = '#183A40',
  subtitleColor = '#668087',
  actionLabel,
  onAction,
  actionAccessibilityLabel,
  actionTextColor = '#FFFFFF',
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
      <Text style={[styles.title, { color: titleColor }]} accessibilityRole="header">{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.action, { backgroundColor: color }]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
        >
          <Text style={[styles.actionText, { color: actionTextColor }]}>{actionLabel}</Text>
        </TouchableOpacity>
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
  action: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 13, paddingHorizontal: 18, marginTop: 8 },
  actionText: { fontSize: 15, fontWeight: '700' },
});
