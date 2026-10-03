import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { useMedicamentos } from '../../src/features/medicamentos/useMedicamentos';
import { FRECUENCIAS } from '../../src/config/constants';
import { notificationService } from '../../src/features/notifications/notificationService';

const PRESETS_PROXIMA_TOMA = [
  { label: '1 min', segundos: 60 },
  { label: '5 min', segundos: 5 * 60 },
  { label: '30 min', segundos: 30 * 60 },
  { label: '1 hora', segundos: 60 * 60 },
  { label: '8 horas', segundos: 8 * 60 * 60 },
];

export default function NuevoMedicamentoScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const { add } = useMedicamentos();

  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuenciaIdx, setFrecuenciaIdx] = useState(2);
  const [presetIdx, setPresetIdx] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
      const proximaToma = Date.now() + preset.segundos * 1000;

      await add({
        nombre: nombre.trim(),
        dosis: dosis.trim(),
        frecuenciaHoras: frecuencia.horas,
        proximaToma,
      });

      await notificationService.requestPermissions();
      await notificationService.schedule(
        nombre.trim(),
        preset.segundos,
        user?.name
      );

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
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Nuevo Medicamento
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            Completá los datos y programá el recordatorio
          </Text>

          <View style={[styles.formCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>
              Nombre
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg }]}>
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
              />
            </View>

            <Text style={[styles.label, { color: theme.colors.subtext }]}>
              Dosis
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg }]}>
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
              />
            </View>

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
              {PRESETS_PROXIMA_TOMA.map((p, i) => (
                <TouchableOpacity
                  key={p.label}
                  style={[
                    styles.chip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor:
                        presetIdx === i ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setPresetIdx(i)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: presetIdx === i ? '#FFF' : theme.colors.text },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
            >
              <Text style={styles.saveBtnText}>
                {submitting ? 'Guardando...' : 'Guardar medicamento'}
              </Text>
              <Ionicons name="checkmark-outline" size={20} color="#FFF" />
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
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 24 },
  formCard: { borderRadius: 24, padding: 24, gap: 8 },
  label: {
    fontSize: 12,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
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
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});