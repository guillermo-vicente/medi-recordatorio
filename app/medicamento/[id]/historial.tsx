import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { useMedicamentos } from '../../../src/features/medicamentos/useMedicamentos';
import { usePersonas } from '../../../src/features/personas/usePersonas';
import { useTheme } from '../../../src/theme/useTheme';

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
          <Text style={[styles.title, { color: theme.colors.text }]}>Historial de tomas</Text>
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
        <FlatList
          data={historial}
          keyExtractor={(item, index) => `${item.fecha}-${item.estado}-${index}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={(
            <View style={[styles.summary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.summaryText, { color: theme.colors.subtext }]}>
                Se muestran las {historial.length} tomas más recientes registradas.
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const taken = item.estado === 'tomado';
            const color = taken ? theme.colors.success : theme.colors.danger;
            const date = new Date(item.fecha);
            return (
              <View style={[styles.entry, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={[styles.entryIcon, { backgroundColor: `${color}18` }]}>
                  <Ionicons name={taken ? 'checkmark-circle-outline' : 'close-circle-outline'} size={23} color={color} />
                </View>
                <View style={styles.entryContent}>
                  <Text style={[styles.entryTitle, { color }]}>{taken ? 'Realizada' : 'Omitida'}</Text>
                  <Text style={[styles.entryDate, { color: theme.colors.text }]}>
                    {date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.entryTime, { color: theme.colors.subtext }]}>
                    {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
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
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 4 },
  summaryText: { flex: 1, fontSize: 14, lineHeight: 20 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16, minHeight: 80 },
  entryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  entryContent: { flex: 1 },
  entryTitle: { fontSize: 16, fontWeight: '700' },
  entryDate: { fontSize: 15, marginTop: 3 },
  entryTime: { fontSize: 14, marginTop: 2 },
});
