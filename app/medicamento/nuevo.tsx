import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/features/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { useMedicamentos } from '../../src/features/medicamentos/useMedicamentos';
import type { Medicamento } from '../../src/features/medicamentos/medicamentoService';
import { FRECUENCIAS } from '../../src/config/constants';
import { notificationService } from '../../src/features/notifications/notificationService';
import { showAlert } from '../../src/utils/dialogs';

const PRESETS_PROXIMA_TOMA = [
  { label: '1 hora', segundos: 60 * 60, esPrueba: false },
  { label: '4 horas', segundos: 4 * 60 * 60, esPrueba: false },
  { label: '8 horas', segundos: 8 * 60 * 60, esPrueba: false },
  { label: '12 horas', segundos: 12 * 60 * 60, esPrueba: false },
  { label: '24 horas', segundos: 24 * 60 * 60, esPrueba: false },
  { label: 'Prueba 15 s', segundos: 15, esPrueba: true },
];

export default function NuevoMedicamentoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const { user } = useAuth();
  const { add, update, medicamentos } = useMedicamentos();

  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [momentoComida, setMomentoComida] = useState<Medicamento['momentoComida']>();
  const [observaciones, setObservaciones] = useState('');
  const [frecuenciaIdx, setFrecuenciaIdx] = useState(2);
  const [presetIdx, setPresetIdx] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(id);

  useEffect(() => {
    const item = medicamentos.find((med) => med.id === id);
    if (!item) return;
    setNombre(item.nombre);
    setDosis(item.dosis);
    setMomentoComida(item.momentoComida);
    setObservaciones(item.observaciones ?? item.indicaciones ?? '');
    const idx = FRECUENCIAS.findIndex((frecuencia) => frecuencia.horas === item.frecuenciaHoras);
    if (idx >= 0) setFrecuenciaIdx(idx);
  }, [id, medicamentos]);

  const handleSave = async () => {
    const errs: string[] = [];
    if (!nombre.trim()) errs.push('El nombre es requerido');
    if (!dosis.trim()) errs.push('La dosis es requerida');
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const frecuencia = FRECUENCIAS[frecuenciaIdx];
      const preset = PRESETS_PROXIMA_TOMA[presetIdx];
      const proximaToma = editing
        ? Date.now() + FRECUENCIAS[frecuenciaIdx].horas * 60 * 60 * 1000
        : Date.now() + preset.segundos * 1000;
      const data = {
        nombre: nombre.trim(),
        dosis: dosis.trim(),
        momentoComida,
        observaciones: observaciones.trim(),
        frecuenciaHoras: frecuencia.horas,
        proximaToma,
        indicaciones: undefined,
      };
      let itemId = id;
      let previousNotificationId: string | undefined;
      if (editing) {
        const existing = medicamentos.find((med) => med.id === id);
        previousNotificationId = existing?.notificationId;
        await update(id!, { ...data, estado: 'pendiente', notificationId: undefined });
      } else {
        const created = await add(data);
        itemId = created.id;
      }
      if (previousNotificationId) await notificationService.cancel(previousNotificationId);
      const allowed = await notificationService.requestPermissions();
      if (allowed || !notificationService.isAvailable()) {
        const notificationId = await notificationService.schedule(
          nombre.trim(), editing ? frecuencia.horas * 60 * 60 : preset.segundos, user?.name
        );
        if (itemId) await update(itemId, { notificationId: notificationId ?? undefined });
      } else {
        showAlert('Notificaciones desactivadas', 'El medicamento se guardó, pero no recibirás avisos hasta habilitar las notificaciones en la configuración del dispositivo.');
      }

      router.back();
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Error desconocido']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            {editing ? 'Editar medicamento' : 'Nuevo medicamento'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            Completá los datos y programá el recordatorio
          </Text>

          <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>
              Nombre
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
              <Ionicons
                name="medical-outline"
                size={20}
                color={theme.colors.subtext}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Ej: Ibuprofeno"
                placeholderTextColor={theme.colors.subtext}
                value={nombre}
                onChangeText={setNombre}
                editable={!submitting}
                accessibilityLabel="Nombre del medicamento"
              />
            </View>

            <Text style={[styles.label, { color: theme.colors.subtext }]}>
              Dosis
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
              <Ionicons
                name="flask-outline"
                size={20}
                color={theme.colors.subtext}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Ej: 400mg"
                placeholderTextColor={theme.colors.subtext}
                value={dosis}
                onChangeText={setDosis}
                editable={!submitting}
                accessibilityLabel="Dosis del medicamento"
              />
            </View>

            <Text style={[styles.label, { color: theme.colors.subtext }]}>Momento indicado respecto de la comida</Text>
            <Text style={[styles.helperText, { color: theme.colors.subtext }]}>Registrá lo que indicó el profesional de salud.</Text>
            <View style={styles.chipsRow}>
              {([
                { value: 'antes', label: 'Antes' },
                { value: 'durante', label: 'Durante' },
                { value: 'despues', label: 'Después' },
                { value: 'sin_indicar', label: 'Sin indicar' },
              ] as const).map((option) => {
                const selected = momentoComida === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, { minHeight: 44, justifyContent: 'center', borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primary : 'transparent' }]}
                    onPress={() => setMomentoComida(selected ? undefined : option.value)}
                    disabled={submitting}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text style={[styles.chipText, { color: selected ? '#FFF' : theme.colors.text }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: theme.colors.subtext }]}>Observaciones</Text>
            <TextInput
              style={[styles.notesInput, { color: theme.colors.text, backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
              placeholder="Anotá otros detalles que quieras recordar."
              placeholderTextColor={theme.colors.subtext}
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              maxLength={500}
              textAlignVertical="top"
              editable={!submitting}
              accessibilityLabel="Observaciones del medicamento"
            />

            <Text style={[styles.label, { color: theme.colors.subtext }]}>
              Frecuencia
            </Text>
            <View style={styles.chipsRow}>
              {FRECUENCIAS.map((f, i) => (
                <TouchableOpacity
                  key={f.label}
                  style={[
                    styles.chip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor:
                        frecuenciaIdx === i ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setFrecuenciaIdx(i)}
                  disabled={submitting}
                  accessibilityRole="radio"
                  accessibilityLabel={`Cada ${f.horas} horas`}
                  accessibilityState={{ checked: frecuenciaIdx === i }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          frecuenciaIdx === i ? '#FFF' : theme.colors.text,
                      },
                    ]}
                  >
                    {f.horas}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.colors.subtext }]}>
              Próxima toma (recibirás la notificación)
            </Text>
            <View style={styles.chipsRow}>
              {(editing ? FRECUENCIAS.map((f) => ({ label: f.label, segundos: f.horas * 3600 })) : PRESETS_PROXIMA_TOMA).map((p, i) => (
                <TouchableOpacity
                  key={p.label}
                  style={[
                    styles.chip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor:
                        (editing ? frecuenciaIdx : presetIdx) === i ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => editing ? setFrecuenciaIdx(i) : setPresetIdx(i)}
                  disabled={submitting}
                  accessibilityRole="radio"
                  accessibilityLabel={editing ? `Próxima toma según ${p.label}` : `Próxima toma: ${p.label}`}
                  accessibilityState={{ checked: (editing ? frecuenciaIdx : presetIdx) === i }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: (editing ? frecuenciaIdx : presetIdx) === i ? '#FFF' : theme.colors.text },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!editing && PRESETS_PROXIMA_TOMA[presetIdx]?.esPrueba ? (
              <View style={[styles.testNote, { backgroundColor: `${theme.colors.primary}12` }]}>
                <Ionicons name="flask-outline" size={17} color={theme.colors.primary} />
                <Text style={[styles.testNoteText, { color: theme.colors.text }]}>
                  Modo de prueba: el aviso llega en 15 segundos. La frecuencia elegida se mantiene para las tomas siguientes.
                </Text>
              </View>
            ) : null}

            {errors.length > 0 && (
              <View style={styles.errorContainer}>
                {errors.map((err, i) => (
                  <Text
                    key={i}
                    style={[styles.errorText, { color: theme.colors.danger }]}
                  >
                    {err}
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: theme.colors.primary },
                submitting && styles.disabled,
              ]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={editing ? 'Guardar cambios del medicamento' : 'Guardar medicamento'}
            >
              <Text style={[styles.saveBtnText, { color: theme.colors.onPrimary }]}>
                {submitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar medicamento'}
              </Text>
              <Ionicons name="checkmark-outline" size={20} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingVertical: 20 },
  backBtn: { minWidth: 44, minHeight: 44, marginBottom: 16, alignSelf: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 24 },
  formCard: { borderRadius: 22, padding: 22, gap: 8, borderWidth: 1 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    height: 54,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: { fontSize: 15, fontWeight: '600' },
  notesInput: { minHeight: 96, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16 },
  helperText: { fontSize: 14, lineHeight: 20, marginTop: -4 },
  testNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: 12, marginBottom: 8 },
  testNoteText: { flex: 1, fontSize: 12, lineHeight: 17 },
  errorContainer: { marginTop: 8 },
  errorText: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 54,
    marginTop: 16,
    gap: 8,
  },
  disabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});
