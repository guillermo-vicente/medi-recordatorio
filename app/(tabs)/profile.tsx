import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/theme/useTheme';
import { useAppTheme } from '../../src/theme/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.banner }]}>
          <Text style={styles.headerEyebrow}>MEDIRECORDATORIO</Text>
          <Text style={styles.headerTitle}>Mi perfil</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.colors.subtext }]}>CUENTA · SOLO LECTURA</Text>
        <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="person" size={34} color={theme.colors.onPrimary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user?.name ?? 'Usuario'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.subtext }]}>
              {user?.email ?? 'Sin correo disponible'}
            </Text>
            <Text style={[styles.readOnlyHint, { color: theme.colors.subtext }]}>Datos locales de esta cuenta</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.colors.subtext }]}>
          PREFERENCIAS
        </Text>

        <View style={[styles.groupCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.settingRow}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: theme.colors.primary + '1A' },
              ]}
            >
              <Ionicons
                name="moon"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Modo oscuro
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.subtext }]}>
                {isDark ? 'Activado' : 'Desactivado'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E0E0E0', true: theme.colors.primary }}
              accessibilityLabel="Activar o desactivar el modo oscuro"
              accessibilityState={{ checked: isDark }}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.colors.subtext }]}>ACERCA DE</Text>
        <View style={[styles.groupCard, styles.aboutCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.settingRow}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '1A' }]}>
              <Ionicons name="medical-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>MediRecordatorio</Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.subtext }]}>Versión {appVersion}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.settingRow}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '1A' }]}>
              <Ionicons name="school-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Desarrollada por</Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.subtext }]}>Guillermo Vicente · Proyecto académico ISTEA</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={[styles.logoutText, { color: theme.colors.danger }]}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 72,
  },
  header: { paddingHorizontal: 20, paddingVertical: 18, borderRadius: 20, marginBottom: 24 },
  headerEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, color: 'rgba(255,255,255,0.76)' },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    color: '#FFFFFF',
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginBottom: 8, marginLeft: 4 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 22,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800' },
  userEmail: { fontSize: 14, marginTop: 4 },
  readOnlyHint: { fontSize: 12, marginTop: 7 },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  aboutCard: { marginBottom: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    marginTop: 20,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
