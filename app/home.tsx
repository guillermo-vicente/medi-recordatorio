import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/features/auth/useAuth';
import { useTheme } from '../src/theme/useTheme';

export default function HomeScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const theme = useTheme();

    const handleLogout = async () => {
        await signOut();
        router.replace('/');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    Bienvenido
                </Text>
                <Text style={[styles.email, { color: theme.colors.subtext }]}>
                    {user?.email}
                </Text>
                <Text style={[styles.note, { color: theme.colors.subtext }]}>
                    Proximamente: lista de medicamentos
                </Text>
                <TouchableOpacity
                    style={[styles.logoutBtn, { borderColor: theme.colors.border }]}
                    onPress={handleLogout}
                >
                    <Text style={[styles.logoutText, { color: theme.colors.danger }]}>
                        Cerrar sesion
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 8,
    },
    title: { fontSize: 28, fontWeight: '800' },
    email: { fontSize: 15 },
    note: { fontSize: 13, marginTop: 12, marginBottom: 24 },
    logoutBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
    },
    logoutText: { fontSize: 15, fontWeight: '700' },
});