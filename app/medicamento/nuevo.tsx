import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import {
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/features/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { useMedicamentos } from '../../src/features/medicamentos/useMedicamentos';
import { calcularProximaTomaDiaria } from '../../src/features/medicamentos/medicamentoService';
import type { Medicamento } from '../../src/features/medicamentos/medicamentoService';
import { getOwnPersonaId } from '../../src/features/personas/personaService';
import { usePersonas } from '../../src/features/personas/usePersonas';
import { FRECUENCIAS } from '../../src/config/constants';
import { notificationService } from '../../src/features/notifications/notificationService';
import { showAlert } from '../../src/utils/dialogs';
import { ImagePickerField } from '../../src/components/ui/ImagePickerField';
import { mediaService } from '../../src/services/mediaService';

function parseHorariosDiarios(input: string): { horarios: string[]; error?: string } {
  const maxHorarios = 12;
  const values = input.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
  if (!values.length) return { horarios: [], error: 'Agregá al menos un horario diario.' };
  if (values.length > maxHorarios) return { horarios: [], error: `Podés indicar hasta ${maxHorarios} horarios por día.` };
  const normalized: string[] = [];
  for (const value of values) {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return { horarios: [], error: `Revisá el horario "${value}". Usá el formato HH:MM.` };
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) return { horarios: [], error: `El horario "${value}" no es válido.` };
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    if (normalized.includes(time)) return { horarios: [], error: `El horario ${time} está repetido.` };
    normalized.push(time);
  }
  return { horarios: normalized.sort() };
}

export default function NuevoMedicamentoScreen() {
  const router = useRouter();
  const { id, personaId: personaIdParam } = useLocalSearchParams<{ id?: string; personaId?: string }>();
  const theme = useTheme();
  const { user } = useAuth();
  const { add, update, medicamentos } = useMedicamentos();
  const { personas, reload: reloadPersonas } = usePersonas();

  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [momentoComida, setMomentoComida] = useState<Medicamento['momentoComida']>();
  const [observaciones, setObservaciones] = useState('');
  const [personaId, setPersonaId] = useState('');
  const [frecuenciaIdx, setFrecuenciaIdx] = useState(-1);
  const [tipoHorario, setTipoHorario] = useState<'intervalo' | 'diario'>('intervalo');
  const [horariosTexto, setHorariosTexto] = useState('');
  const [avisoPrueba, setAvisoPrueba] = useState(false);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(id);
  const initialLoadDone = useRef<string | null>(null);
  const fotoOriginal = useRef<string | undefined>(undefined);
  const fotosPendientes = useRef(new Set<string>());
  const [fotoUri, setFotoUri] = useState<string | undefined>();

  // Estados del escáner
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const barcodeHandled = useRef(false);
  const [scanTarget, setScanTarget] = useState<'nombre' | 'observaciones'>('nombre');

  const handleOpenScanner = async (target: 'nombre' | 'observaciones' = 'nombre') => {
    setScanTarget(target);
    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();
    if (!permission.granted) {
      showAlert('Permiso de cámara', 'Habilitá el acceso a la cámara para escanear un código QR.');
      return;
    }
    barcodeHandled.current = false;
    setScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (barcodeHandled.current) return;
    barcodeHandled.current = true;
    setScannerVisible(false);

    if (scanTarget === 'observaciones') {
      setObservaciones((prev) => prev ? `${prev}\n${data.trim()}` : data.trim());
      return;
    }

    // Lógica si estamos escaneando para el Nombre
    const parts = data.split('|');
    if (parts.length >= 2) {
      setNombre(parts[0].trim());
      setDosis(parts[1].trim());
      // Abrimos las notas para que vea el resultado
      setMostrarDetalles(true); 
    } else {
      // Si es un QR random, lo mandamos a Observaciones
      setObservaciones((prev) => prev ? `${prev}\n${data.trim()}` : data.trim());
       // Abrimos la sección de notas
      setMostrarDetalles(true);
      showAlert('QR Escaneado', 'El texto se agregó a las Observaciones.');
    }
  };

  useEffect(() => () => {
    fotosPendientes.current.forEach((uri) => { void mediaService.deleteImage(uri); });
  }, []);

  useFocusEffect(useCallback(() => { void reloadPersonas(); }, [reloadPersonas]));

  useEffect(() => {
    if (initialLoadDone.current === id) return;
    const item = medicamentos.find((med) => med.id === id);
    if (!item) return;
    initialLoadDone.current = id ?? null;
    setNombre(item.nombre);
    setDosis(item.dosis);
    setMomentoComida(item.momentoComida);
    const savedObservaciones = item.observaciones ?? item.indicaciones ?? '';
    setObservaciones(savedObservaciones);
    setMostrarDetalles(Boolean(item.momentoComida || savedObservaciones));
    setPersonaId(item.personaId ?? getOwnPersonaId(user?.email ?? ''));
    setTipoHorario(item.tipoHorario ?? 'intervalo');
    setHorariosTexto(item.horariosDiarios?.join(', ') ?? '');
    setFotoUri(item.fotoUri);
    fotoOriginal.current = item.fotoUri;
    const idx = FRECUENCIAS.findIndex((frecuencia) => frecuencia.horas === item.frecuenciaHoras);
    if (idx >= 0) setFrecuenciaIdx(idx);
  }, [id, medicamentos, user?.email]);

  useEffect(() => {
    if (!editing) setPersonaId(personaIdParam ?? (user?.email ? getOwnPersonaId(user.email) : ''));
  }, [editing, personaIdParam, user?.email]);

  const handleSave = async () => {
    const errs: string[] = [];
    if (!nombre.trim()) errs.push('El nombre es requerido');
    if (!dosis.trim()) errs.push('La dosis es requerida');
    if (!personaId) {
      errs.push('Seleccioná una persona para esta ficha.');
    } else if (!personas.some((p) => p.id === personaId)) {
      errs.push('La persona seleccionada no está disponible. Volvé a intentar.');
    }
    if (tipoHorario === 'intervalo' && frecuenciaIdx < 0) {
      errs.push('Elegí el intervalo indicado para este medicamento.');
    }
    const parsedSchedule = tipoHorario === 'diario'
      ? parseHorariosDiarios(horariosTexto)
      : { horarios: [] as string[] };
    if (parsedSchedule.error) errs.push(parsedSchedule.error);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const frecuenciaHoras = FRECUENCIAS[frecuenciaIdx]?.horas ?? FRECUENCIAS[2].horas;
      const now = Date.now();
      const horariosDiarios = tipoHorario === 'diario' ? parsedSchedule.horarios : undefined;
      const proximaToma = tipoHorario === 'diario'
        ? calcularProximaTomaDiaria(horariosDiarios ?? [], now)
        : now + frecuenciaHoras * 60 * 60 * 1000;
      const data = {
        nombre: nombre.trim(),
        dosis: dosis.trim(),
        momentoComida,
        observaciones: observaciones.trim(),
        personaId,
        tipoHorario,
        horariosDiarios,
        inicioHorario: tipoHorario === 'intervalo' ? now : undefined,
        frecuenciaHoras,
        proximaToma,
        indicaciones: undefined,
        notificationIds: [] as string[],
        notificationId: undefined,
        fotoUri
      };
      let itemId = id;
      const existing = editing ? medicamentos.find((med) => med.id === id) : undefined;
      if (editing) {
        await update(id!, { ...data, estado: 'pendiente' });
      } else {
        const created = await add(data);
        itemId = created.id;
      }
      fotosPendientes.current.forEach((uri) => {
        if (uri !== fotoUri) void mediaService.deleteImage(uri);
      });
      fotosPendientes.current.clear();
      if (fotoOriginal.current && fotoOriginal.current !== fotoUri) {
        await mediaService.deleteImage(fotoOriginal.current);
      }
      await notificationService.cancelMany([...(existing?.notificationIds ?? []), existing?.notificationId]);
      const allowed = await notificationService.requestPermissions();
      const scheduledIds: string[] = [];
      if (allowed || !notificationService.isAvailable()) {
        const personaNombre = personas.find((persona) => persona.id === personaId)?.nombre;
        scheduledIds.push(...await notificationService.schedulePlan(data, personaNombre));
        if (avisoPrueba) {
          const testId = await notificationService.schedule(nombre.trim(), 15, personaNombre);
          if (testId) scheduledIds.push(testId);
        }
        if (itemId) await update(itemId, { notificationIds: scheduledIds, notificationId: undefined });
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={submitting} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
            {editing ? 'Editar medicamento' : 'Nuevo medicamento'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            Completá los datos y programá el recordatorio
          </Text>

          <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.label, { color: theme.colors.subtext }]}>Nombre</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
              <Ionicons name="medical-outline" size={20} color={theme.colors.subtext} style={styles.inputIcon} />
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

            <Text style={[styles.label, { color: theme.colors.subtext }]}>Dosis</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
              <Ionicons name="flask-outline" size={20} color={theme.colors.subtext} style={styles.inputIcon} />
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

            <Text style={[styles.label, { color: theme.colors.subtext }]}>Persona</Text>
            <View style={styles.chipsRow}>
              {personas.map((persona) => {
                const selected = personaId === persona.id;
                return (
                  <TouchableOpacity
                    key={persona.id}
                    style={[styles.chip, { borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primary : 'transparent' }]}
                    onPress={() => setPersonaId(persona.id)}
                    disabled={submitting}
                    accessibilityRole="radio"
                    accessibilityLabel={`Medicamento para ${persona.nombre}`}
                    accessibilityState={{ checked: selected }}
                  >
                    <Text style={[styles.chipText, { color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{persona.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.chip, { borderColor: theme.colors.border }]}
                onPress={() => router.push('../personas')}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Administrar personas"
              >
                <Text style={[styles.chipText, { color: theme.colors.primary }]}>+ Persona</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.colors.subtext }]}>Tipo de horario</Text>
            <View style={styles.chipsRow}>
              {([
                { value: 'intervalo', label: 'Cada ciertas horas' },
                { value: 'diario', label: 'Horarios diarios' },
              ] as const).map((option) => {
                const selected = tipoHorario === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, { borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primary : 'transparent' }]}
                    onPress={() => setTipoHorario(option.value)}
                    disabled={submitting}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text style={[styles.chipText, { color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {tipoHorario === 'intervalo' ? (
              <>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Intervalo indicado</Text>
                <Text style={[styles.helperText, { color: theme.colors.subtext }]}>Elegí el intervalo que indicó el profesional.</Text>
                <View style={[styles.chipsRow, { flexWrap: 'nowrap', justifyContent: 'space-between' }]}>
                  {FRECUENCIAS.map((f, i) => {
                    const selected = frecuenciaIdx === i;
                    return (
                      <TouchableOpacity
                        key={f.label}
                        style={[styles.chip, { flex: 1, alignItems: 'center', paddingHorizontal: 0, marginHorizontal: 2, borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primary : 'transparent' }]}
                        onPress={() => setFrecuenciaIdx(i)}
                        disabled={submitting}
                        accessibilityRole="radio"
                        accessibilityLabel={`Cada ${f.horas} horas`}
                        accessibilityState={{ checked: selected }}
                      >
                        <Text style={[styles.chipText, { color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{f.horas} h</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.helperText, { color: theme.colors.subtext }]}>El recordatorio se repite desde que guardás este plan.</Text>
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Horarios indicados (hora local)</Text>
                <TextInput
                  style={[styles.notesInput, styles.scheduleInput, { color: theme.colors.text, backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
                  value={horariosTexto}
                  onChangeText={setHorariosTexto}
                  placeholder="08:00, 14:00, 20:00"
                  placeholderTextColor={theme.colors.subtext}
                  editable={!submitting}
                  accessibilityLabel="Horarios diarios, separados por comas"
                />
                <Text style={[styles.helperText, { color: theme.colors.subtext }]}>Separalos por comas (por ejemplo, 08:00, 14:00). Hasta 12 horarios por día.</Text>
              </>
            )}

            {/* SECCIÓN FOTO DE REFERENCIA */}
            <View style={[styles.photoSection, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
              <View style={styles.photoSectionHeading}>
                <View style={[styles.photoSectionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name="image-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.photoSectionCopy}>
                  <Text style={[styles.optionalTitle, { color: theme.colors.text }]}>Foto de referencia</Text>
                  <Text style={[styles.helperText, { color: theme.colors.subtext }]}>Opcional · caja, envase o receta</Text>
                </View>
              </View>
              <ImagePickerField
                value={fotoUri}
                onChange={(uri) => {
                  setFotoUri(uri);
                  if (uri && uri !== fotoOriginal.current) fotosPendientes.current.add(uri);
                }}
                label=""
                aspect={[4, 3]}
                disabled={submitting}
              />
            </View>

            {/* SECCIÓN ESCÁNER QR (Movida aquí) */}
            <View style={[styles.photoSection, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
              <View style={styles.photoSectionHeading}>
                <View style={[styles.photoSectionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Ionicons name="qr-code-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.photoSectionCopy}>
                  <Text style={[styles.optionalTitle, { color: theme.colors.text }]}>Escanear QR</Text>
                  <Text style={[styles.helperText, { color: theme.colors.subtext }]}>Opcional · autocompletar datos</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.scanButton, { borderColor: theme.colors.primary, paddingVertical: 12 }]}
                onPress={() => handleOpenScanner('nombre')}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Escanear código QR para completar nombre y dosis"
              >
                <Ionicons name="qr-code-outline" size={17} color={theme.colors.primary} />
                <Text style={[styles.scanButtonText, { color: theme.colors.primary }]}>Escanear código</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.optionalSection, { borderColor: theme.colors.border }]}>
              <TouchableOpacity
                style={styles.optionalHeader}
                onPress={() => setMostrarDetalles((visible) => !visible)}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Mostrar indicaciones, observaciones y aviso de prueba"
                accessibilityState={{ expanded: mostrarDetalles }}
              >
                <View style={styles.optionalHeadingText}>
                  <Text style={[styles.optionalTitle, { color: theme.colors.text }]}>Indicaciones y notas</Text>
                  <Text style={[styles.helperText, { color: theme.colors.subtext }]}>Opcional · comida, observaciones.</Text>
                </View>
                <Ionicons name={mostrarDetalles ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              {mostrarDetalles ? (
                <View style={styles.optionalContent}>
                  <Text style={[styles.label, { color: theme.colors.subtext }]}>Momento indicado respecto de la comida</Text>
                  <Text style={[styles.helperText, { color: theme.colors.subtext }]}>Anotá únicamente lo que indicó el profesional de salud.</Text>
                  <View style={styles.chipsRow}>
                    {([
                      { value: 'antes', label: 'Antes' },
                      { value: 'durante', label: 'Durante' },
                      { value: 'despues', label: 'Después' },
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
                          <Text style={[styles.chipText, { color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{option.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* OBSERVACIONES CON ESCÁNER */}
                  <View style={styles.obsLabelContainer}>
                    <Text style={[styles.label, { marginTop: 0, color: theme.colors.subtext }]}>Observaciones</Text>
                    <TouchableOpacity
                      style={[styles.scanButton, { borderColor: theme.colors.primary, minHeight: 32 }]}
                      onPress={() => handleOpenScanner('observaciones')}
                      disabled={submitting}
                      accessibilityRole="button"
                      accessibilityLabel="Escanear QR para agregar a las observaciones"
                    >
                      <Ionicons name="qr-code-outline" size={15} color={theme.colors.primary} />
                      <Text style={[styles.scanButtonText, { color: theme.colors.primary }]}>Escanear</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.notesInput, { color: theme.colors.text, backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}
                    placeholder="Otros detalles a recordar."
                    placeholderTextColor={theme.colors.subtext}
                    value={observaciones}
                    onChangeText={setObservaciones}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                    editable={!submitting}
                    accessibilityLabel="Observaciones del medicamento"
                  />
                  <View style={[styles.testToggle, { borderColor: theme.colors.border }]}>
                    <View style={styles.testToggleText}>
                      <Text style={[styles.testToggleTitle, { color: theme.colors.text }]}>Aviso de prueba en 15 segundos</Text>
                      <Text style={[styles.helperText, { color: theme.colors.subtext }]}>Es un aviso extra; no modifica el plan.</Text>
                    </View>
                    <Switch
                      value={avisoPrueba}
                      onValueChange={setAvisoPrueba}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      disabled={submitting}
                      accessibilityLabel="Enviar un aviso de prueba en 15 segundos"
                      accessibilityState={{ checked: avisoPrueba }}
                    />
                  </View>
                </View>
              ) : null}
            </View>

            {errors.length > 0 && (
              <View style={styles.errorContainer}>
                {errors.map((err, i) => (
                  <Text key={i} style={[styles.errorText, { color: theme.colors.danger }]}>{err}</Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.colors.primary }, submitting && styles.disabled]}
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

      <Modal
        visible={scannerVisible}
        animationType="fade"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
          </View>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Escanear código QR</Text>
            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => setScannerVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar escáner"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.scannerHint}>Enfocá un QR con el formato Nombre|Dosis</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 20 },
  backBtn: { minWidth: 44, minHeight: 44, marginBottom: 16, alignSelf: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 24 },
  formCard: { borderRadius: 22, padding: 22, gap: 8, borderWidth: 1 },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, height: 54, borderWidth: 1, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  nameFieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  nameLabel: { marginTop: 0 },
  scanButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10 },
  scanButtonText: { fontSize: 13, fontWeight: '700' },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanFrame: { width: 260, height: 260, borderWidth: 3, borderColor: '#55C7B3', borderRadius: 24, backgroundColor: 'transparent' },
  scannerHeader: { position: 'absolute', top: 56, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scannerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  closeScannerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.55)' },
  scannerHint: { position: 'absolute', bottom: 70, alignSelf: 'center', color: '#fff', fontSize: 15, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontSize: 15, fontWeight: '600' },
  notesInput: { minHeight: 96, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16 },
  scheduleInput: { minHeight: 52 },
  helperText: { fontSize: 14, lineHeight: 20, marginTop: -4 },
  testToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 8 },
  testToggleText: { flex: 1, gap: 4 },
  testToggleTitle: { fontSize: 15, fontWeight: '700' },
  optionalSection: { borderWidth: 1, borderRadius: 14, marginTop: 8, overflow: 'hidden' },
  photoSection: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 8 },
  photoSectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoSectionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  photoSectionCopy: { flex: 1, gap: 3 },
  optionalHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 8 },
  optionalHeadingText: { flex: 1, gap: 4 },
  optionalTitle: { fontSize: 15, fontWeight: '700' },
  optionalContent: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  obsLabelContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  errorContainer: { marginTop: 8 },
  errorText: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, height: 54, marginTop: 1, marginBottom: 15, gap: 8 },
  disabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});