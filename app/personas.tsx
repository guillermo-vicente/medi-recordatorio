import { useEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePersonas } from '../src/features/personas/usePersonas';
import { useMedicamentos } from '../src/features/medicamentos/useMedicamentos';
import { useTheme } from '../src/theme/useTheme';
import { showAlert, showConfirm } from '../src/utils/dialogs';
import { ImagePickerField } from '../src/components/ui/ImagePickerField';
import { mediaService } from '../src/services/mediaService';
import { contactService } from '../src/services/contactService';

export default function PersonasScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { personas, isLoading, add, update, remove } = usePersonas();
  const { medicamentos } = useMedicamentos();
  const [nombre, setNombre] = useState('');
  const [relacion, setRelacion] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const pendingAvatarUri = useRef<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState<{ name: string; phone?: string } | undefined>();
  const [editingPersona, setEditingPersona] = useState<(typeof personas)[number] | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRelacion, setEditRelacion] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState<{ name: string; phone?: string } | undefined>();

  const handlePickContact = async () => {
    try {
      const contact = await contactService.pickContact();
      if (contact) setEmergencyContact(contact);
    } catch (error) {
      showAlert('No se pudo abrir contactos', error instanceof Error ? error.message : undefined);
    }
  };

  const handleEdit = (persona: (typeof personas)[number]) => {
    setEditingPersona(persona);
    setEditNombre(persona.nombre);
    setEditRelacion(persona.relacion ?? '');
    setEditEmergencyContact(persona.emergencyContact);
  };

  const handlePickEditContact = async () => {
    try {
      const contact = await contactService.pickContact();
      if (contact) setEditEmergencyContact(contact);
    } catch (error) {
      showAlert('No se pudo abrir contactos', error instanceof Error ? error.message : undefined);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPersona) return;
    if (!editNombre.trim()) {
      showAlert('Falta el nombre', 'Escribí el nombre de la persona para guardar los cambios.');
      return;
    }
    setSaving(true);
    try {
      await update(editingPersona, editNombre, editRelacion, editEmergencyContact);
      setEditingPersona(null);
    } catch (error) {
      showAlert('No se pudieron guardar los cambios', error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => () => {
    if (pendingAvatarUri.current) void mediaService.deleteImage(pendingAvatarUri.current);
  }, []);

  const handleAdd = async () => {
    if (!nombre.trim()) {
      showAlert('Falta el nombre', 'Escribí el nombre de la persona para crear su ficha.');
      return;
    }
    setSaving(true);
    try {
      await add(nombre, relacion, avatarUri, emergencyContact);
      pendingAvatarUri.current = undefined;
      setNombre('');
      setRelacion('');
      setAvatarUri(undefined);
      setEmergencyContact(undefined); // Limpiamos el contacto
    } catch (error) {
      showAlert('No se pudo crear la ficha', error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (personaId: string, personaName: string) => {
    const confirmed = await showConfirm({
      title: 'Quitar ficha',
      message: `¿Querés quitar la ficha de ${personaName}? Solo se puede hacer si no tiene medicamentos asociados.`,
      confirmText: 'Quitar ficha',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (!confirmed) return;
    const persona = personas.find((item) => item.id === personaId);
    if (!persona) return;
    try {
      await remove(persona);
    } catch (error) {
      showAlert('No se pudo quitar la ficha', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver a medicamentos"
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">Personas</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
          Administrá una ficha propia y las personas a quienes acompañás. Cada ficha mantiene sus medicamentos separados.
        </Text>

        <View style={[styles.form, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Agregar una persona</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre"
            placeholderTextColor={theme.colors.subtext}
            editable={!saving}
            accessibilityLabel="Nombre de la persona"
          />
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
            value={relacion}
            onChangeText={setRelacion}
            placeholder="Vínculo, referencial (opcional)"
            placeholderTextColor={theme.colors.subtext}
            editable={!saving}
            maxLength={60}
            accessibilityLabel="Vínculo con la persona, opcional"
          />
          <ImagePickerField
            value={avatarUri}
            onChange={(nextUri) => {
              const previousUri = pendingAvatarUri.current;
              pendingAvatarUri.current = nextUri;
              setAvatarUri(nextUri);
              if (previousUri && previousUri !== nextUri) void mediaService.deleteImage(previousUri);
            }}
            label="Avatar (opcional)"
            placeholderDescription=""
            disabled={saving}
          />

          {/* CONTACTO DE EMERGENCIA - FLUJO CONDICIONAL */}
          {emergencyContact ? (
            <View style={[styles.contactCard, { borderColor: theme.colors.border }]}>
              <View style={styles.contactInfo}>
                <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                <View>
                  <Text style={[styles.contactName, { color: theme.colors.text }]}>{emergencyContact.name}</Text>
                  {emergencyContact.phone && (
                    <Text style={[styles.contactPhone, { color: theme.colors.subtext }]}>{emergencyContact.phone}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setEmergencyContact(undefined)} accessibilityRole="button" accessibilityLabel="Quitar contacto de emergencia">
                <Ionicons name="close-circle" size={22} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.addContactBtn, { borderColor: theme.colors.primary }]} 
              onPress={handlePickContact}
              accessibilityRole="button"
              accessibilityLabel="Agregar contacto de emergencia"
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.addContactText, { color: theme.colors.primary }]}>Agregar contacto de emergencia</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAdd}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Agregar persona"
          >
            <Ionicons name="person-add-outline" size={19} color={theme.colors.onPrimary} />
            <Text style={[styles.addButtonText, { color: theme.colors.onPrimary }]}>{saving ? 'Guardando…' : 'Agregar ficha'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.listTitle, { color: theme.colors.subtext }]}>FICHAS DE SEGUIMIENTO</Text>
        {isLoading ? (
          <Text style={[styles.empty, { color: theme.colors.subtext }]}>Cargando fichas…</Text>
        ) : personas.map((persona) => {
          const count = medicamentos.filter((item) => item.personaId === persona.id).length;
          const openMedicamentos = () => router.navigate({
            pathname: '/(tabs)/home',
            params: { personaId: persona.id },
          });
          return (
            <View key={persona.id} style={[styles.personCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.personIcon, { backgroundColor: `${theme.colors.primary}18` }]}>
                {persona.avatarUri ? (
                  <Image source={{ uri: persona.avatarUri }} style={styles.personAvatarImage} />
                ) : (
                  <Ionicons name={persona.esPropia ? 'person-outline' : 'people-outline'} size={22} color={theme.colors.primary} />
                )}
              </View>
              <View style={styles.personInfo}>
                <TouchableOpacity
                  onPress={openMedicamentos}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver medicamentos de ${persona.esPropia ? 'mi ficha' : persona.nombre}`}
                >
                  <Text style={[styles.personName, { color: theme.colors.text }]}>
                    {persona.esPropia ? 'Mis Medicamentos' : persona.nombre}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.personMeta, { color: theme.colors.subtext }]}>
                  {persona.esPropia ? 'Mi ficha' : persona.relacion || 'Persona a mi cuidado'} · {count} {count === 1 ? 'medicamento' : 'medicamentos'}
                </Text>
                {persona.emergencyContact && (
                  <View style={styles.listContactBadge}>
                    <Ionicons name="call" size={12} color={theme.colors.danger} />
                    <Text style={[styles.listContactText, { color: theme.colors.subtext }]}>
                      Emergencia: {persona.emergencyContact.name}
                    </Text>
                  </View>
                )}
              </View>
              {!persona.esPropia ? (
                <View style={styles.personActions}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleEdit(persona)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ficha de ${persona.nombre}`}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(persona.id, persona.nombre)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ficha de ${persona.nombre}`}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      <Modal
        visible={!!editingPersona}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setEditingPersona(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.editModal, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Editar ficha</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Nombre"
              placeholderTextColor={theme.colors.subtext}
              editable={!saving}
              accessibilityLabel="Nombre de la persona"
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
              value={editRelacion}
              onChangeText={setEditRelacion}
              placeholder="Vínculo (opcional)"
              placeholderTextColor={theme.colors.subtext}
              editable={!saving}
              maxLength={60}
              accessibilityLabel="Vínculo con la persona, opcional"
            />
            {editEmergencyContact ? (
              <View style={[styles.contactCard, { borderColor: theme.colors.border }]}>
                <View style={styles.contactInfo}>
                  <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                  <View>
                    <Text style={[styles.contactName, { color: theme.colors.text }]}>{editEmergencyContact.name}</Text>
                    {editEmergencyContact.phone ? <Text style={[styles.contactPhone, { color: theme.colors.subtext }]}>{editEmergencyContact.phone}</Text> : null}
                  </View>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity onPress={handlePickEditContact} disabled={saving} accessibilityRole="button" accessibilityLabel="Cambiar contacto de emergencia">
                    <Ionicons name="create-outline" size={21} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditEmergencyContact(undefined)} disabled={saving} accessibilityRole="button" accessibilityLabel="Quitar contacto de emergencia">
                    <Ionicons name="close-circle" size={22} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addContactBtn, { borderColor: theme.colors.primary }]}
                onPress={handlePickEditContact}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Agregar contacto de emergencia"
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.addContactText, { color: theme.colors.primary }]}>Agregar contacto de emergencia</Text>
              </TouchableOpacity>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: theme.colors.border }]} onPress={() => setEditingPersona(null)} disabled={saving}>
                <Text style={[styles.cancelText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, styles.saveEditButton, { backgroundColor: theme.colors.primary }]} onPress={handleSaveEdit} disabled={saving}>
                <Text style={[styles.addButtonText, { color: theme.colors.onPrimary }]}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36, gap: 12 },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  subtitle: { fontSize: 16, lineHeight: 23, marginBottom: 8 },
  form: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  addButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13 },
  addButtonText: { fontSize: 16, fontWeight: '700' },
  listTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginTop: 14, marginBottom: 2 },
  empty: { fontSize: 15, paddingVertical: 18 },
  personCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  personIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  personAvatarImage: { width: '100%', height: '100%' },
  personInfo: { flex: 1 },
  personName: { fontSize: 17, fontWeight: '700' },
  personMeta: { fontSize: 14, lineHeight: 19, marginTop: 3 },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  personActions: { flexDirection: 'row', alignItems: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.55)' },
  editModal: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 13 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  saveEditButton: { flex: 1 },
  contactCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactName: { fontSize: 15, fontWeight: '600' },
  contactPhone: { fontSize: 13 },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderWidth: 1, borderRadius: 12, borderStyle: 'dashed' },
  addContactText: { fontSize: 14, fontWeight: '600' },
  listContactBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  listContactText: { fontSize: 12, fontWeight: '500' },
});
