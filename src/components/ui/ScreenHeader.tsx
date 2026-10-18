import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface Props {
  eyebrow?: string;
  title: string;
  avatarUri?: string;
  onAvatarPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({ eyebrow = 'MEDIRECORDATORIO', title, avatarUri, onAvatarPress, style }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.banner }, style]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {onAvatarPress ? (
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onAvatarPress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={avatarUri ? 'Editar foto de perfil' : 'Agregar foto de perfil'}
          >
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={styles.avatar} />
              : <Ionicons name="person" size={26} color="#FFFFFF" />}
          </TouchableOpacity>
        ) : avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatar} /> : null}
      </View>
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
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    color: '#FFFFFF',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },
  avatarButton: { width: 52, height: 52, marginRight: 4, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transform: [{ translateY: -3 }] },
});
