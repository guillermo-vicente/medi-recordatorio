import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/theme/useTheme';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { mediaService } from '../../src/services/mediaService';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateAvatar, updateName } = useAuth();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarOptionsVisible, setAvatarOptionsVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? '');
  
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';

  const handleLogout = async () => {
    await signOut();
    router.replace('/');
  };

  const changeAvatar = async (source: 'camera' | 'gallery') => {
    if (avatarBusy) return;
    setAvatarBusy(true);
    let newAvatarUri: string | undefined;
    try {
      const image = source === 'camera'
        ? await mediaService.takePhoto()
        : await mediaService.pickImage();
      if (!image) return;

      newAvatarUri = image.uri;
      const previousAvatarUri = user?.avatarUri;
      await updateAvatar(newAvatarUri);
      if (previousAvatarUri && previousAvatarUri !== newAvatarUri) {
        await mediaService.deleteImage(previousAvatarUri);
      }
    } catch (error) {
      if (newAvatarUri) await mediaService.deleteImage(newAvatarUri);
      Alert.alert(
        source === 'camera' ? 'No se pudo abrir la cámara' : 'No se pudo abrir la galería',
        error instanceof Error ? error.message : 'Intentá nuevamente.'
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    if (!user?.avatarUri || avatarBusy) return;
    const previousAvatarUri = user.avatarUri;
    setAvatarBusy(true);
    try {
      await updateAvatar(undefined);
      await mediaService.deleteImage(previousAvatarUri);
    } catch (error) {
      Alert.alert('No se pudo quitar la foto', error instanceof Error ? error.message : 'Intentá nuevamente.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    try {
      await updateName(newName);
      setEditNameVisible(false);
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el nombre.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      edges={['top']}
    >
      <View style={styles.content}>
        <ScreenHeader title="Mi perfil" style={styles.headerFrame} />

        <Text style={[styles.sectionLabel, { color: theme.colors.subtext }]}>CUENTA · DATOS LOCALES</Text>
        <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            onPress={() => setAvatarOptionsVisible(true)}
            disabled={avatarBusy}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={user?.avatarUri ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
          >
            {user?.avatarUri ? (
              <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={34} color={theme.colors.onPrimary} />
            )}
            <View style={[styles.avatarAction, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              {avatarBusy
                ? <ActivityIndicator size="small" color={theme.colors.primary} />
                : <Ionicons name="camera" size={14} color={theme.colors.primary} />}
            </View>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <TouchableOpacity
              onPress={() => { setNewName(user?.name ?? ''); setEditNameVisible(true); }}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user?.name ?? 'Usuario'}
              </Text>
              <Ionicons name="pencil" size={16} color={theme.colors.subtext} />
            </TouchableOpacity>
            <Text style={[styles.userEmail, { color: theme.colors.subtext }]}>
              {user?.email ?? 'Sin correo disponible'}
            </Text>
            <Text style={[styles.readOnlyHint, { color: theme.colors.subtext }]}>Tocá la imagen para cambiarla</Text>
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
      </View>

      {/* MODAL: Opciones de Avatar */}
      <Modal visible={avatarOptionsVisible} transparent animationType="slide" onRequestClose={() => setAvatarOptionsVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setAvatarOptionsVisible(false)}>
          <Pressable style={{ backgroundColor: theme.colors.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 10 }} onPress={(e) => e.stopPropagation()}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>Foto de perfil</Text>
            <TouchableOpacity style={{ paddingVertical: 14 }} onPress={() => { setAvatarOptionsVisible(false); void changeAvatar('camera'); }}>
              <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '600' }}>📷 Tomar una foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 14 }} onPress={() => { setAvatarOptionsVisible(false); void changeAvatar('gallery'); }}>
              <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '600' }}>🖼️ Elegir de la galería</Text>
            </TouchableOpacity>
            {user?.avatarUri && (
              <TouchableOpacity style={{ paddingVertical: 14 }} onPress={() => { setAvatarOptionsVisible(false); void removeAvatar(); }}>
                <Text style={{ color: theme.colors.danger, fontSize: 16, fontWeight: '600' }}>🗑️ Quitar foto</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={{ paddingVertical: 14, alignItems: 'center', marginTop: 4 }} onPress={() => setAvatarOptionsVisible(false)}>
              <Text style={{ color: theme.colors.subtext, fontSize: 16, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL: Editar Nombre */}
      <Modal visible={editNameVisible} transparent animationType="fade" onRequestClose={() => setEditNameVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.colors.card, padding: 20, borderRadius: 16, gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>Editar nombre</Text>
            <TextInput
              style={{ backgroundColor: theme.colors.bg, color: theme.colors.text, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border }}
              value={newName}
              onChangeText={setNewName}
              placeholder="Tu nombre"
              placeholderTextColor={theme.colors.subtext}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={{ flex: 1, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10 }} onPress={() => setEditNameVisible(false)}>
                <Text style={{ color: theme.colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 12, alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 10 }} onPress={handleSaveName}>
                <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerFrame: { marginBottom: 24 },
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
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarAction: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderWidth: 2,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 5,
    marginBottom: 15,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});