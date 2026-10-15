import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePersonas } from '../src/features/personas/usePersonas';
import { useMedicamentos } from '../src/features/medicamentos/useMedicamentos';
import { useTheme } from '../src/theme/useTheme';
import { showAlert, showConfirm } from '../src/utils/dialogs';

export default function PersonasScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { personas, isLoading, add, remove } = usePersonas();
  const { medicamentos } = useMedicamentos();
  const [nombre, setNombre] = useState('');
  const [relacion, setRelacion] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!nombre.trim()) {
      showAlert('Falta el nombre', 'Escribí el nombre de la persona para crear su ficha.');
      return;
    }
    setSaving(true);
    try {
      await add(nombre, relacion);
      setNombre('');
      setRelacion('');
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

        <Text style={[styles.title, { color: theme.colors.text }]}>Personas</Text>
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
          return (
            <View key={persona.id} style={[styles.personCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.personIcon, { backgroundColor: `${theme.colors.primary}18` }]}>
                <Ionicons name={persona.esPropia ? 'person-outline' : 'people-outline'} size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.personInfo}>
                <Text style={[styles.personName, { color: theme.colors.text }]}>{persona.nombre}</Text>
                <Text style={[styles.personMeta, { color: theme.colors.subtext }]}>
                  {persona.esPropia ? 'Mi ficha' : persona.relacion || 'Persona a mi cuidado'} · {count} {count === 1 ? 'medicamento' : 'medicamentos'}
                </Text>
              </View>
              {!persona.esPropia ? (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(persona.id, persona.nombre)}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ficha de ${persona.nombre}`}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
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
  personIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  personInfo: { flex: 1 },
  personName: { fontSize: 17, fontWeight: '700' },
  personMeta: { fontSize: 14, lineHeight: 19, marginTop: 3 },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
