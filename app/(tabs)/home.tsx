import { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
  ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/features/auth/useAuth';
import { useTheme } from '../../src/theme/useTheme';
import { useMedicamentos } from '../../src/features/medicamentos/useMedicamentos';
import { Medicamento } from '../../src/features/medicamentos/medicamentoService';
import { ESTADOS_TOMA } from '../../src/config/constants';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useRouter, useFocusEffect } from 'expo-router'; 
import { showConfirm } from '../../src/utils/dialogs';
import { usePersonas } from '../../src/features/personas/usePersonas';
import { getOwnPersonaId } from '../../src/features/personas/personaService';
import { calcularProximaToma } from '../../src/features/medicamentos/medicamentoService';

function getEstadoMeta(estado: Medicamento['estado']) {
    if (estado === ESTADOS_TOMA.tomado.key) return ESTADOS_TOMA.tomado;
    if (estado === ESTADOS_TOMA.omitido.key) return ESTADOS_TOMA.omitido;
    return ESTADOS_TOMA.pendiente;
}

function getMomentoComidaLabel(item: Medicamento): string | undefined {
    const labels = {
        antes: 'Antes de comer',
        durante: 'Durante la comida',
        despues: 'Después de comer',
        sin_indicar: 'Sin indicar',
    };
    return item.momentoComida ? labels[item.momentoComida] : undefined;
}

function getHorarioResumen(item: Medicamento): string {
    if (item.tipoHorario === 'diario' && item.horariosDiarios?.length) {
        return `Horarios: ${item.horariosDiarios.join(' · ')}`;
    }
    return `Cada ${item.frecuenciaHoras} h`;
}

export default function HomeScreen() {
    const { user } = useAuth();
    const theme = useTheme();
    const {
        medicamentos,
        isLoading,
        isRefreshing,
        error,
        refresh,
        reloadSilently,
        markAsTaken,
        markAsMissed,
        remove,
    } = useMedicamentos();
    const { personas, reload: reloadPersonas } = usePersonas();
    const [personaActivaId, setPersonaActivaId] = useState<string | null>(null);

    useEffect(() => {
        if (!personas.length) return;
        if (!personaActivaId || !personas.some((persona) => persona.id === personaActivaId)) {
            setPersonaActivaId(personas[0].id);
        }
    }, [personas, personaActivaId]);

    const personaActiva = personas.find((persona) => persona.id === personaActivaId);
    const medicamentosPersona = medicamentos.filter((item) => item.personaId === personaActivaId);

    const router = useRouter();

     // recarga la lista cada vez que el Home toma foco
    useFocusEffect(
        useCallback(() => {
            reloadSilently();
            void reloadPersonas();
        }, [reloadSilently, reloadPersonas])
    );

    const handleAdd = useCallback(() => {
        router.push({ pathname: '/medicamento/nuevo', params: { personaId: personaActivaId ?? getOwnPersonaId(user?.email ?? '') } });
    }, [router, personaActivaId, user?.email]);

    const handleMarkTaken = useCallback(async (item: Medicamento) => {
        const details = [
            `Dosis: ${item.dosis}`,
            `Frecuencia: cada ${item.frecuenciaHoras} horas`,
            getMomentoComidaLabel(item) ? `Momento indicado: ${getMomentoComidaLabel(item)}` : '',
            (item.observaciones ?? item.indicaciones) ? `Observaciones: ${item.observaciones ?? item.indicaciones}` : '',
            '',
            '¿Registrar esta toma como realizada?',
        ].filter(Boolean).join('\n');
        if (await showConfirm({ title: item.nombre, message: details, confirmText: 'Marcar tomada', cancelText: 'Cancelar' })) {
            await markAsTaken(item.id);
        }
    }, [markAsTaken]);

    const handleMarkMissed = useCallback(async (item: Medicamento) => {
        const confirmed = await showConfirm({
            title: 'Registrar toma omitida',
            message: `¿Querés registrar como omitida la toma de ${item.nombre}? Se conservará el horario previsto del plan.`,
            confirmText: 'Registrar omitida',
            cancelText: 'Cancelar',
        });
        if (confirmed) await markAsMissed(item.id);
    }, [markAsMissed]);

    const renderItem = useCallback(
        ({ item }: { item: Medicamento }) => {
            const meta = getEstadoMeta(item.proximaToma <= Date.now() ? 'pendiente' : item.estado);
            const statusColor = meta.key === 'tomado'
                ? theme.colors.success
                : meta.key === 'omitido'
                    ? theme.colors.danger
                    : theme.colors.warning;
            const ultimoRegistro = item.historialTomas?.[item.historialTomas.length - 1];
            const momentoComidaLabel = getMomentoComidaLabel(item);
            const observaciones = item.observaciones ?? item.indicaciones;
            const proximaToma = calcularProximaToma(item);

            return (
                <View
                    style={[
                        styles.card,
                        { backgroundColor: theme.colors.card, borderLeftColor: statusColor, borderColor: theme.colors.border },
                    ]}
                >
                    <View style={[styles.cardIcon, { backgroundColor: statusColor + '18' }]}>
                        <Ionicons name="medical-outline" size={23} color={statusColor} />
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text
                                style={[styles.cardTitle, { color: theme.colors.text }]}
                                numberOfLines={1}
                            >
                                {item.nombre}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: `${statusColor}18` }]}>
                                <Text style={[styles.badgeText, { color: statusColor }]}>{meta.label}</Text>
                            </View>
                        </View>
                        <Text style={[styles.cardSubtitle, { color: theme.colors.subtext }]}>
                            {item.dosis} · {getHorarioResumen(item)}
                        </Text>
                        {momentoComidaLabel ? (
                            <Text style={[styles.cardNote, { color: theme.colors.text }]}>
                                Momento indicado: {momentoComidaLabel}
                            </Text>
                        ) : null}
                        {observaciones ? (
                            <Text style={[styles.cardNote, { color: theme.colors.text }]}>Observaciones: {observaciones}</Text>
                        ) : null}
                        <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>
                            Próximo aviso: {new Date(proximaToma).toLocaleString()}
                        </Text>
                        {ultimoRegistro || item.ultimaToma ? (
                            <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>
                                Último registro: {ultimoRegistro?.estado ?? 'tomado'} · {new Date(ultimoRegistro?.fecha ?? item.ultimaToma!).toLocaleString()}
                            </Text>
                        ) : null}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.primaryAction, { backgroundColor: theme.colors.primary }]}
                                onPress={() => handleMarkTaken(item)}
                                accessibilityRole="button"
                                accessibilityLabel={`Registrar toma realizada de ${item.nombre}`}
                            >
                                <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.onPrimary} />
                                <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>Marcar tomada</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: `${theme.colors.danger}66`, backgroundColor: `${theme.colors.danger}12` }]}
                                onPress={() => handleMarkMissed(item)}
                                accessibilityRole="button"
                                accessibilityLabel={`Registrar toma omitida de ${item.nombre}`}
                            >
                                <Ionicons name="close-circle-outline" size={17} color={theme.colors.danger} />
                                <Text style={[styles.actionText, { color: theme.colors.danger }]}>Omitida</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: theme.colors.border }]}
                                onPress={() => router.push({ pathname: '/medicamento/nuevo', params: { id: item.id } })}
                                accessibilityRole="button"
                                accessibilityLabel={`Editar ${item.nombre}`}
                            >
                                <Ionicons name="create-outline" size={17} color={theme.colors.primary} />
                                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: theme.colors.border }]}
                                onPress={() => router.push({ pathname: '../medicamento/[id]/historial', params: { id: item.id } })}
                                accessibilityRole="button"
                                accessibilityLabel={`Ver historial de ${item.nombre}`}
                            >
                                <Ionicons name="time-outline" size={17} color={theme.colors.primary} />
                                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Historial</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: theme.colors.border }]}
                                onPress={async () => {
                                    const confirmed = await showConfirm({ title: 'Eliminar medicamento', message: `¿Querés eliminar ${item.nombre}?`, confirmText: 'Eliminar', cancelText: 'Cancelar', destructive: true });
                                    if (confirmed) await remove(item.id);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Eliminar ${item.nombre}`}
                            >
                                <Ionicons name="trash-outline" size={17} color={theme.colors.danger} />
                                <Text style={[styles.actionText, { color: theme.colors.danger }]}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        },
        [theme, handleMarkTaken, handleMarkMissed, router, remove]
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <LoadingState
                    message="Cargando medicamentos..."
                    color={theme.colors.primary}
                    textColor={theme.colors.subtext}
                />
            );
        }

        if (error) {
            return (
                <ErrorState
                    message={error}
                    onRetry={refresh}
                    color={theme.colors.primary}
                    dangerColor={theme.colors.danger}
                    actionTextColor={theme.colors.onPrimary}
                    textColor={theme.colors.text}
                    mutedColor={theme.colors.subtext}
                />
            );
        }

        return (
            <FlatList
                data={medicamentosPersona}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={[
                    styles.listContent,
                    medicamentosPersona.length === 0 && styles.listEmpty,
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="medkit-outline"
                        color={theme.colors.primary}
                        titleColor={theme.colors.text}
                        subtitleColor={theme.colors.subtext}
                        emoji="💊"
                        title="Sin medicamentos"
                        subtitle={`Tocá el botón + para agregar un medicamento${personaActiva ? ` para ${personaActiva.nombre}` : ''}`}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        );
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.bg }]}
            edges={['top']}
        >
            <View style={[styles.header, { backgroundColor: theme.colors.banner }]}>
                <View style={styles.headerTop}>
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>TU RUTINA, MÁS SIMPLE</Text>
                        <Text style={styles.title}>Hola, {user?.name ?? 'Usuario'}</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="heart-outline" size={25} color="#FFFFFF" />
                    </View>
                </View>
                <Text style={styles.headerCaption}>
            {personaActiva?.nombre ?? 'Cargando ficha'} · {medicamentosPersona.length} {medicamentosPersona.length === 1 ? 'medicamento' : 'medicamentos'}
                </Text>
            </View>

            <View style={styles.peopleSelector}>
                <View style={styles.peopleSelectorHeader}>
                    <Text style={[styles.peopleSelectorLabel, { color: theme.colors.subtext }]}>PERSONA</Text>
                    <TouchableOpacity
                        onPress={() => router.push('../personas')}
                        accessibilityRole="button"
                        accessibilityLabel="Administrar personas"
                    >
                        <Text style={[styles.managePeopleText, { color: theme.colors.primary }]}>Administrar</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRow}>
                    {personas.map((persona) => {
                        const selected = persona.id === personaActivaId;
                        return (
                            <TouchableOpacity
                                key={persona.id}
                                style={[styles.personChip, { borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primary : theme.colors.card }]}
                                onPress={() => setPersonaActivaId(persona.id)}
                                accessibilityRole="radio"
                                accessibilityLabel={`Ver medicamentos de ${persona.nombre}`}
                                accessibilityState={{ checked: selected }}
                            >
                                <Text style={[styles.personChipText, { color: selected ? theme.colors.onPrimary : theme.colors.text }]}>{persona.nombre}</Text>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        style={[styles.personChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                        onPress={() => router.push('../personas')}
                        accessibilityRole="button"
                        accessibilityLabel="Agregar persona"
                    >
                        <Ionicons name="add" size={17} color={theme.colors.primary} />
                        <Text style={[styles.personChipText, { color: theme.colors.primary }]}>Agregar</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {renderContent()}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={handleAdd}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Agregar medicamento"
            >
                        <Ionicons name="add" size={28} color={theme.colors.onPrimary} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 14,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 18,
        borderRadius: 22,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerText: { flex: 1 },
    greeting: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, color: 'rgba(255,255,255,0.76)' },
    title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 5 },
    headerCaption: { color: 'rgba(255,255,255,0.86)', fontSize: 15, marginTop: 12 },
    headerIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
    peopleSelector: { paddingHorizontal: 20, marginBottom: 10 },
    peopleSelectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
    peopleSelectorLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    managePeopleText: { fontSize: 14, fontWeight: '700', paddingVertical: 4 },
    peopleRow: { gap: 8, paddingBottom: 2 },
    personChip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 14, borderWidth: 1, borderRadius: 13 },
    personChipText: { fontSize: 15, fontWeight: '600' },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        gap: 12,
    },
    listEmpty: { flex: 1 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderColor: '#DDEAE7',
        shadowColor: '#102326',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: { flex: 1 },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
    cardSubtitle: { fontSize: 15 },
    cardNote: { fontSize: 15, marginTop: 6, lineHeight: 21 },
    cardMeta: { fontSize: 13, marginTop: 6, lineHeight: 19 },
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    actionButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, borderWidth: 1, borderRadius: 12 },
    primaryAction: { borderColor: 'transparent' },
    actionText: { fontSize: 14, fontWeight: '600' },
    badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
});
