import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { useMedicamentos } from '../../../src/features/medicamentos/useMedicamentos';
import { usePersonas } from '../../../src/features/personas/usePersonas';
import { useTheme } from '../../../src/theme/useTheme';
import { calcularProximaToma } from '../../../src/features/medicamentos/medicamentoService';

type TomaHistorial = { fecha: number; estado: 'tomado' | 'omitido'; ubicacion?: string };
type HistorialSection = {
  key: string;
  title: string;
  summary: string;
  data: TomaHistorial[];
};

function getLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSectionTitle(key: string, now = new Date()): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateKey = getLocalDateKey(date.getTime());
  if (dateKey === getLocalDateKey(today.getTime())) return 'Hoy';
  if (dateKey === getLocalDateKey(yesterday.getTime())) return 'Ayer';

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };
  if (year !== now.getFullYear()) options.year = 'numeric';
  const label = date.toLocaleDateString('es-AR', options);
  return label.charAt(0).toLocaleUpperCase('es-AR') + label.slice(1);
}

function getSectionSummary(tomas: TomaHistorial[]): string {
  const realizadas = tomas.filter((toma) => toma.estado === 'tomado').length;
  const omitidas = tomas.length - realizadas;
  const parts = [
    realizadas ? `${realizadas} realizada${realizadas === 1 ? '' : 's'}` : '',
    omitidas ? `${omitidas} omitida${omitidas === 1 ? '' : 's'}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

export default function HistorialMedicamentoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { medicamentos, isLoading, error, refresh } = useMedicamentos();
  const { personas } = usePersonas();
  const medicamento = medicamentos.find((item) => item.id === id);
  const persona = personas.find((item) => item.id === medicamento?.personaId);
  
  const historial = useMemo(
    () => [...(medicamento?.historialTomas ?? [])].sort((a, b) => b.fecha - a.fecha),
    [medicamento?.historialTomas]
  );
  
  const secciones = useMemo<HistorialSection[]>(() => {
    const byLocalDay = new Map<string, TomaHistorial[]>();
    for (const toma of historial) {
      const key = getLocalDateKey(toma.fecha);
      const existing = byLocalDay.get(key);
      if (existing) existing.push(toma);
      else byLocalDay.set(key, [toma]);
    }

    return Array.from(byLocalDay.entries())
      .sort(([dayA], [dayB]) => dayB.localeCompare(dayA))
      .map(([key, data]) => ({
        key,
        title: getSectionTitle(key),
        summary: getSectionSummary(data),
        data,
      }));
  }, [historial]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <LoadingState color={theme.colors.primary} textColor={theme.colors.subtext} message="Cargando historial..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <ErrorState
          message={error}
          onRetry={refresh}
          color={theme.colors.primary}
          dangerColor={theme.colors.danger}
          actionTextColor={theme.colors.onPrimary}
          textColor={theme.colors.text}
          mutedColor={theme.colors.subtext}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          accessibilityRole="button"
          accessibilityLabel="Volver a medicamentos"
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">Historial de tomas</Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]} numberOfLines={1}>
            {medicamento ? `${persona?.nombre ?? 'Persona'} · ${medicamento.nombre}` : 'Medicamento'}
          </Text>
        </View>
      </View>

      {!medicamento ? (
        <EmptyState
          icon="alert-circle-outline"
          color={theme.colors.danger}
          titleColor={theme.colors.text}
          subtitleColor={theme.colors.subtext}
          title="No encontramos este medicamento"
          subtitle="Puede que se haya eliminado. Volvé a la lista para actualizarla."
        />
      ) : historial.length === 0 ? (
        <EmptyState
          icon="time-outline"
          color={theme.colors.primary}
          titleColor={theme.colors.text}
          subtitleColor={theme.colors.subtext}
          title="Todavía no hay tomas registradas"
          subtitle="Cuando registres una toma como realizada u omitida, aparecerá acá."
        />
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(item, index) => `${item.fecha}-${item.estado}-${index}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          ListHeaderComponent={(
            <View style={{ gap: 12, marginBottom: 8 }}>
              {/* NUEVO: Próxima toma */}
              {medicamento && (
                <View style={[styles.summary, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, borderWidth: 1.5 }]}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryText, { color: theme.colors.text, fontWeight: '700' }]}>
                      Próxima toma programada
                    </Text>
                    <Text style={[styles.summaryText, { color: theme.colors.subtext }]}>
                      {new Date(calcularProximaToma(medicamento)).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={[styles.summary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.subtext} />
                <Text style={[styles.summaryText, { color: theme.colors.subtext }]}>
                  Se muestran las {historial.length} tomas más recientes registradas.
                </Text>
              </View>
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <View style={[styles.dayHeader, { backgroundColor: theme.colors.bg }]}>
              <Text style={[styles.dayTitle, { color: theme.colors.text }]} accessibilityRole="header">
                {section.title}
              </Text>
              <Text style={[styles.daySummary, { color: theme.colors.subtext }]}>
                {section.summary}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const taken = item.estado === 'tomado';
            const color = taken ? theme.colors.success : theme.colors.danger;
            const date = new Date(item.fecha);
            const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            return (
              <View
                style={[styles.entry, { borderBottomColor: theme.colors.border }]}
                accessible
                accessibilityLabel={`${taken ? 'Realizada' : 'Omitida'}, ${time}`}
              >
                <View style={[styles.entryIcon, { backgroundColor: `${color}18` }]}>
                  <Ionicons name={taken ? 'checkmark-circle-outline' : 'close-circle-outline'} size={23} color={color} />
                </View>
                <View style={styles.entryContent}>
                  <Text style={[styles.entryTitle, { color }]}>{taken ? 'Realizada' : 'Omitida'}</Text>
                  {item.ubicacion ? (
                    <View style={styles.location}>
                      <Ionicons name="location-outline" size={14} color={theme.colors.subtext} />
                      <Text style={[styles.locationText, { color: theme.colors.subtext }]}>{item.ubicacion}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.entryTime, { color: theme.colors.subtext }]}>{time}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18 },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1 },
  heading: { flex: 1 },
  title: { fontSize: 23, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 3 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, padding: 14 },
  summaryText: { flex: 1, fontSize: 14, lineHeight: 20 },
  dayHeader: { paddingTop: 18, paddingBottom: 8 },
  dayTitle: { fontSize: 18, fontWeight: '800' },
  daySummary: { fontSize: 13, marginTop: 3 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 56 },
  entryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  entryContent: { flex: 1 },
  entryTitle: { fontSize: 15, fontWeight: '700' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  locationText: { flex: 1, fontSize: 12 },
  entryTime: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
});