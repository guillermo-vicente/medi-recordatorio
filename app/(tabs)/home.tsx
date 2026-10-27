import { useCallback, useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import {
    FlatList,
    Alert,
    Image,
    Modal,
    Pressable,
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
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { showConfirm } from '../../src/utils/dialogs';
import { usePersonas } from '../../src/features/personas/usePersonas';
import { getOwnPersonaId } from '../../src/features/personas/personaService';
import { calcularProximaToma } from '../../src/features/medicamentos/medicamentoService';
import { mediaService } from '../../src/services/mediaService';

import { locationService } from '../../src/services/locationService';


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
    const { user, updateAvatar } = useAuth();
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
    const [accionesMedicamento, setAccionesMedicamento] = useState<Medicamento | null>(null);
    const [fotoAmpliada, setFotoAmpliada] = useState<Medicamento | null>(null);
    const [selectorPersonasVisible, setSelectorPersonasVisible] = useState(false);
    const [avatarBusy, setAvatarBusy] = useState(false);
    const { personaId: personaIdParam } = useLocalSearchParams<{ personaId?: string }>();
    const router = useRouter();

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

    const showAvatarOptions = () => {
        if (avatarBusy) return;
        const options = [
            { text: 'Tomar una foto', onPress: () => void changeAvatar('camera') },
            { text: 'Elegir de la galería', onPress: () => void changeAvatar('gallery') },
        ];
        if (user?.avatarUri) options.push({ text: 'Quitar foto', onPress: () => void removeAvatar() });
        Alert.alert('Foto de perfil', 'Elegí de dónde querés obtener la imagen.', [
            ...options.map((option) => ({ ...option, style: 'default' as const })),
            { text: 'Cancelar', style: 'cancel' },
        ]);
    };

    useEffect(() => {
        if (!personas.length) return;
        const requestedPersona = personas.find((persona) => persona.id === personaIdParam);
        if (requestedPersona) {
            setPersonaActivaId(requestedPersona.id);
            router.setParams({ personaId: undefined });
            return;
        }
        if (!personaActivaId || !personas.some((persona) => persona.id === personaActivaId)) {
            setPersonaActivaId(personas[0].id);
        }
    }, [personas, personaActivaId, personaIdParam, router]);

    const personaActiva = personas.find((persona) => persona.id === personaActivaId);
    const avatarPersonaActiva = personaActiva?.esPropia ? undefined : personaActiva?.avatarUri;
    const medicamentosPersona = medicamentos.filter((item) => item.personaId === personaActivaId);

    // Recarga los medicamentos y las personas cada vez que Home recupera el foco.
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
            const currentLocation = await locationService.getCurrentLocation().catch(() => null);
            
            let ubicacion: string | undefined;
            if (currentLocation) {
                ubicacion = currentLocation.address
                    || `${currentLocation.latitude}, ${currentLocation.longitude}`;
            }
            await markAsTaken(item.id, ubicacion);
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

    const handleRemove = useCallback(async (item: Medicamento) => {
        setAccionesMedicamento(null);
        const confirmed = await showConfirm({
            title: 'Eliminar medicamento',
            message: `¿Querés eliminar ${item.nombre}?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            destructive: true,
        });
        if (confirmed) await remove(item.id);
    }, [remove]);

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
                    {item.fotoUri ? (
                        <TouchableOpacity
                            onPress={() => setFotoAmpliada(item)}
                            accessibilityRole="button"
                            accessibilityLabel={`Ampliar foto de ${item.nombre}`}
                        >
                            <Image
                                source={{ uri: item.fotoUri }}
                                style={[styles.cardThumbnail, { borderColor: theme.colors.border }]}
                                resizeMode="cover"
                                accessible={false}
                            />
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.cardIcon, { backgroundColor: statusColor + '18' }]}>
                            <Ionicons name="medical-outline" size={23} color={statusColor} />
                        </View>
                    )}
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
                            Próximo aviso: {new Date(proximaToma).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                        </Text>
                        {ultimoRegistro || item.ultimaToma ? (
                            <Text style={[styles.cardMeta, { color: theme.colors.subtext }]}>
                                Último registro: {ultimoRegistro?.estado ?? 'tomado'} · {new Date(ultimoRegistro?.fecha ?? item.ultimaToma!).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                            </Text>
                        ) : null}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.primaryAction,
                                    { backgroundColor: theme.colors.primary },
                                ]}
                                onPress={() => handleMarkTaken(item)}
                                accessibilityRole="button"
                                accessibilityLabel={`Registrar toma realizada de ${item.nombre}`}
                            >
                                <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.onPrimary} />
                                <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>Registrar toma</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.moreAction,
                                    { borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                                ]}
                                onPress={() => setAccionesMedicamento(item)}
                                accessibilityRole="button"
                                accessibilityLabel={`Más acciones para ${item.nombre}`}
                            >
                                <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        },
        [theme, handleMarkTaken]
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
                        title="Sin medicamentos"
                        subtitle={
                            personaActiva
                                ? `No hay medicamentos cargados para ${personaActiva.nombre}. Podés agregar el primero cuando quieras.`
                                : 'Podés agregar un medicamento cuando quieras.'
                        }
                        actionLabel="Agregar medicamento"
                        onAction={handleAdd}
                        actionTextColor={theme.colors.onPrimary}
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
            <ScreenHeader
                title={`Hola, ${user?.name ?? 'Usuario'}`}
                avatarUri={user?.avatarUri}
                onAvatarPress={showAvatarOptions}
                style={styles.headerFrame}
            />

            <View style={styles.peopleSelector}>
                <View style={styles.peopleSelectorHeader}>
                    {personas.length > 1 ? (
                        <TouchableOpacity
                            style={styles.activePersonButton}
                            onPress={() => setSelectorPersonasVisible(true)}
                            accessibilityRole="button"
                            accessibilityLabel={`Cambiar persona. Actualmente ${personaActiva?.esPropia ? 'Mis Medicamentos' : personaActiva?.nombre ?? 'persona'}`}
                        >
                            {avatarPersonaActiva ? (
                                <Image
                                    source={{ uri: avatarPersonaActiva }}
                                    style={styles.activePersonAvatar}
                                />
                            ) : null}
                            <Text style={[styles.activePersonName, { color: theme.colors.text }]} numberOfLines={1}>
                                {personaActiva?.esPropia ? 'Mis Medicamentos:' : personaActiva?.nombre ?? 'Mis Medicamentos:'}
                            </Text>
                            <Ionicons name="chevron-down" size={17} color={theme.colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.activePersonButton}>
                            <Text style={[styles.activePersonName, { color: theme.colors.text }]} numberOfLines={1}>
                                Mis Medicamentos:
                            </Text>
                        </View>
                    )}
                    <View style={styles.peopleActions}>
                        <TouchableOpacity
                            onPress={() => router.push('../personas')}
                            style={[styles.addPersonButton, { backgroundColor: theme.colors.primary }]}
                            accessibilityRole="button"
                            accessibilityLabel="Agregar ficha de persona"
                        >
                            <Ionicons name="add" size={19} color={theme.colors.onPrimary} />
                            <Text style={[styles.addPersonText, { color: theme.colors.onPrimary }]}>Persona</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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

            <Modal
                visible={Boolean(fotoAmpliada)}
                transparent
                animationType="fade"
                onRequestClose={() => setFotoAmpliada(null)}
            >
                <Pressable style={[styles.photoViewerBackdrop, { backgroundColor: theme.colors.overlay }]} onPress={() => setFotoAmpliada(null)}>
                    <Pressable style={[styles.photoViewer, { backgroundColor: theme.colors.card }]} onPress={(event) => event.stopPropagation()}>
                        <View style={styles.photoViewerHeader}>
                            <Text style={[styles.photoViewerTitle, { color: theme.colors.text }]} numberOfLines={1}>{fotoAmpliada?.nombre}</Text>
                            <TouchableOpacity
                                style={styles.photoViewerClose}
                                onPress={() => setFotoAmpliada(null)}
                                accessibilityRole="button"
                                accessibilityLabel="Cerrar foto"
                            >
                                <Ionicons name="close" size={22} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                        {fotoAmpliada?.fotoUri ? (
                            <Image
                                source={{ uri: fotoAmpliada.fotoUri }}
                                style={styles.photoViewerImage}
                                resizeMode="contain"
                                accessible
                                accessibilityLabel={`Foto de referencia de ${fotoAmpliada.nombre}`}
                            />
                        ) : null}
                        <TouchableOpacity
                            style={[styles.photoViewerEdit, { backgroundColor: theme.colors.primary }]}
                            onPress={() => {
                                const item = fotoAmpliada;
                                setFotoAmpliada(null);
                                if (item) router.push({ pathname: '/medicamento/nuevo', params: { id: item.id } });
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Editar medicamento y cambiar foto"
                        >
                            <Ionicons name="create-outline" size={19} color={theme.colors.onPrimary} />
                            <Text style={[styles.photoViewerEditText, { color: theme.colors.onPrimary }]}>Editar medicamento</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={selectorPersonasVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectorPersonasVisible(false)}
            >
                <Pressable style={[styles.sheetBackdrop, { backgroundColor: theme.colors.overlay }]} onPress={() => setSelectorPersonasVisible(false)}>
                    <Pressable style={[styles.actionSheet, { backgroundColor: theme.colors.card }]} onPress={(event) => event.stopPropagation()}>
                        <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />
                        <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Elegir persona</Text>
                        <Text style={[styles.sheetSubtitle, { color: theme.colors.subtext }]}>Mostrando medicamentos de</Text>
                        <ScrollView style={styles.personOptionsList} contentContainerStyle={styles.personOptionsContent} showsVerticalScrollIndicator={false}>
                            {personas.map((persona) => {
                                const selected = persona.id === personaActivaId;
                                const avatarUri = persona.esPropia ? undefined : persona.avatarUri;
                                return (
                                    <TouchableOpacity
                                        key={persona.id}
                                        style={[styles.personOption, { borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? `${theme.colors.primary}14` : theme.colors.card }]}
                                        onPress={() => { setPersonaActivaId(persona.id); setSelectorPersonasVisible(false); }}
                                        accessibilityRole="radio"
                                        accessibilityLabel={persona.esPropia ? 'Mis Medicamentos' : persona.nombre}
                                        accessibilityState={{ checked: selected }}
                                    >
                                        {!persona.esPropia ? (
                                            <View style={[styles.personOptionAvatar, { backgroundColor: `${theme.colors.primary}18` }]}>
                                                {avatarUri ? (
                                                    <Image source={{ uri: avatarUri }} style={styles.personOptionAvatarImage} />
                                                ) : (
                                                    <Ionicons name="people-outline" size={19} color={theme.colors.primary} />
                                                )}
                                            </View>
                                        ) : null}
                                        <Text style={[styles.personOptionText, { color: theme.colors.text }]}>
                                            {persona.esPropia ? 'Mis Medicamentos:' : persona.nombre}
                                        </Text>
                                        <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={21} color={selected ? theme.colors.primary : theme.colors.subtext} />
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={Boolean(accionesMedicamento)}
                transparent
                animationType="slide"
                onRequestClose={() => setAccionesMedicamento(null)}
            >
                <Pressable style={[styles.sheetBackdrop, { backgroundColor: theme.colors.overlay }]} onPress={() => setAccionesMedicamento(null)}>
                    <Pressable style={[styles.actionSheet, { backgroundColor: theme.colors.card }]} onPress={(event) => event.stopPropagation()}>
                        <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />
                        <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{accionesMedicamento?.nombre}</Text>
                        <Text style={[styles.sheetSubtitle, { color: theme.colors.subtext }]}>Otras acciones</Text>
                        {accionesMedicamento ? (
                            <>
                                <SheetAction icon="close-circle-outline" label="Registrar como omitida" color={theme.colors.danger} onPress={() => { const item = accionesMedicamento; setAccionesMedicamento(null); void handleMarkMissed(item); }} />
                                <SheetAction icon="create-outline" label="Editar medicamento" color={theme.colors.primary} onPress={() => { const item = accionesMedicamento; setAccionesMedicamento(null); router.push({ pathname: '/medicamento/nuevo', params: { id: item.id } }); }} />
                                <SheetAction icon="time-outline" label="Ver historial de tomas" color={theme.colors.primary} onPress={() => { const item = accionesMedicamento; setAccionesMedicamento(null); router.push({ pathname: '../medicamento/[id]/historial', params: { id: item.id } }); }} />
                                <SheetAction icon="trash-outline" label="Eliminar medicamento" color={theme.colors.danger} onPress={() => { void handleRemove(accionesMedicamento); }} />
                            </>
                        ) : null}
                        <TouchableOpacity style={[styles.sheetCancel, { borderColor: theme.colors.border }]} onPress={() => setAccionesMedicamento(null)} accessibilityRole="button">
                            <Text style={[styles.sheetCancelText, { color: theme.colors.text }]}>Cerrar</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerFrame: {
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 14,
    },
    peopleSelector: { paddingHorizontal: 20, marginBottom: 12 },
    peopleSelectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    activePersonButton: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8 },
    activePersonAvatar: { width: 32, height: 32, borderRadius: 16 },
    activePersonName: { flexShrink: 1, fontSize: 15, fontWeight: '700' },
    peopleActions: { flexDirection: 'row', alignItems: 'center' },
    addPersonButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 10, borderRadius: 13 },
    addPersonText: { fontSize: 13, fontWeight: '700' },
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
    cardThumbnail: {
        width: 56,
        height: 56,
        borderRadius: 13,
        borderWidth: 1,
        marginRight: 14,
        backgroundColor: '#E8F0EF',
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
    actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
    actionButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12 },
    primaryAction: { borderColor: 'transparent', flex: 1 },
    moreAction: { minWidth: 48, paddingHorizontal: 0 },
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
    sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
    actionSheet: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 6 },
    sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, marginBottom: 12 },
    sheetTitle: { fontSize: 20, fontWeight: '800' },
    sheetSubtitle: { fontSize: 14, marginBottom: 8 },
    sheetAction: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 8 },
    sheetActionText: { fontSize: 16, fontWeight: '600' },
    sheetCancel: { minHeight: 48, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    sheetCancelText: { fontSize: 15, fontWeight: '700' },
    photoViewerBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    photoViewer: { width: '100%', maxWidth: 440, padding: 16, borderRadius: 22, gap: 14 },
    photoViewerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    photoViewerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
    photoViewerClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
    photoViewerImage: { width: '100%', height: 320, borderRadius: 16, backgroundColor: '#101818' },
    photoViewerEdit: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13 },
    photoViewerEditText: { fontSize: 15, fontWeight: '700' },
    personOption: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1 },
    personOptionAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    personOptionAvatarImage: { width: '100%', height: '100%' },
    personOptionsList: { maxHeight: 360 },
    personOptionsContent: { gap: 8, paddingBottom: 4 },
    personOptionText: { flex: 1, fontSize: 16, fontWeight: '600' },
    personOptionMeta: { fontSize: 12 },
});

function SheetAction({ icon, label, color, onPress }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; color: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.sheetAction} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
            <Ionicons name={icon} size={22} color={color} />
            <Text style={[styles.sheetActionText, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}
