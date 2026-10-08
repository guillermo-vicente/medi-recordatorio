import { useCallback } from 'react';
import {
    FlatList,
    RefreshControl,
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

function getEstadoMeta(estado: Medicamento['estado']) {
    if (estado === ESTADOS_TOMA.tomado.key) return ESTADOS_TOMA.tomado;
    if (estado === ESTADOS_TOMA.omitido.key) return ESTADOS_TOMA.omitido;
    return ESTADOS_TOMA.pendiente;
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

    const router = useRouter();

     // recarga la lista cada vez que el Home toma foco
    useFocusEffect(
        useCallback(() => {
            reloadSilently();
        }, [reloadSilently])
    );

    const handleAdd = useCallback(() => {
        router.push('/medicamento/nuevo');
    }, [router]);

    const handleMarkTaken = useCallback(async (item: Medicamento) => {
        const details = [
            `Dosis: ${item.dosis}`,
            `Frecuencia: cada ${item.frecuenciaHoras} horas`,
            item.indicaciones ? `Indicaciones: ${item.indicaciones}` : '',
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
            message: `¿Querés registrar como omitida la toma de ${item.nombre}? El próximo recordatorio se calculará desde ahora.`,
            confirmText: 'Registrar omitida',
            cancelText: 'Cancelar',
        });
        if (confirmed) await markAsMissed(item.id);
    }, [markAsMissed]);

    const renderItem = useCallback(
        ({ item }: { item: Medicamento }) => {
            const meta = getEstadoMeta(item.proximaToma <= Date.now() ? 'pendiente' : item.estado);
            const ultimoRegistro = item.historialTomas?.[item.historialTomas.length - 1];

            return (
                <View
                    style={[
                        styles.card,
                        { backgroundColor: theme.colors.card, borderLeftColor: meta.color },
                    ]}
                >
                    <View style={[styles.cardIcon, { backgroundColor: meta.color + '1A' }]}>
                        <Ionicons name="medical" size={24} color={meta.color} />
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text
                                style={[styles.cardTitle, { color: theme.colors.text }]}
                                numberOfLines={1}
                            >
                                {item.nombre}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: meta.color }]}>
                                <Text style={styles.badgeText}>{meta.label}</Text>
                            </View>
                        </View>
                        <Text style={[styles.cardSubtitle, { color: theme.colors.subtext }]}>
                            {item.dosis} · cada {item.frecuenciaHoras}hs
                        </Text>
                        {item.indicaciones ? (
                            <Text style={[styles.cardNote, { color: theme.colors.text }]}>
                                Indicaciones: {item.indicaciones}
                            </Text>
                        ) : null}
                        <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>
                            Próxima: {new Date(item.proximaToma).toLocaleString()}
                        </Text>
                            <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>
                                Último registro: {ultimoRegistro?.estado ?? 'tomado'} · {new Date(ultimoRegistro?.fecha ?? item.ultimaToma!).toLocaleString()}
                            </Text>
                        ) : null}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: theme.colors.border }]}
                                onPress={() => handleMarkTaken(item)}
                            >
                                <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.primary} />
                                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Marcar toma</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: theme.colors.border }]}
                                onPress={() => handleMarkMissed(item)}
                            >
                                <Ionicons name="close-circle-outline" size={17} color={theme.colors.danger} />
                                <Text style={[styles.actionText, { color: theme.colors.danger }]}>Omitida</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: theme.colors.border }]}
                                onPress={() => router.push({ pathname: '/medicamento/nuevo', params: { id: item.id } })}
                            >
                                <Ionicons name="create-outline" size={17} color={theme.colors.primary} />
                                <Text style={[styles.actionText, { color: theme.colors.primary }]}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { borderColor: theme.colors.border }]}
                                onPress={async () => {
                                    const confirmed = await showConfirm({ title: 'Eliminar medicamento', message: `¿Querés eliminar ${item.nombre}?`, confirmText: 'Eliminar', cancelText: 'Cancelar', destructive: true });
                                    if (confirmed) await remove(item.id);
                                }}
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
                />
            );
        }

        if (error) {
            return <ErrorState message={error} onRetry={refresh} />;
        }

        return (
            <FlatList
                data={medicamentos}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={[
                    styles.listContent,
                    medicamentos.length === 0 && styles.listEmpty,
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
                        emoji="💊"
                        title="Sin medicamentos"
                        subtitle="Tocá el botón + para agregar tu primer medicamento"
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
            <View style={styles.header}>
                <Text style={[styles.greeting, { color: theme.colors.subtext }]}>
                    Hola,
                </Text>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    {user?.name ?? 'Usuario'}
                </Text>
            </View>

            {renderContent()}

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={handleAdd}
                activeOpacity={0.85}
            >
                <Ionicons name="add" size={28} color="#FFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
    },
    greeting: { fontSize: 14, fontWeight: '500' },
    title: { fontSize: 26, fontWeight: '800', marginTop: 2 },
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
        borderLeftWidth: 4,
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
    cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
    cardSubtitle: { fontSize: 13 },
    cardNote: { fontSize: 13, marginTop: 6, lineHeight: 18 },
    cardMeta: { fontSize: 11, marginTop: 6, lineHeight: 16 },
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderRadius: 8 },
    actionText: { fontSize: 12, fontWeight: '600' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
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
