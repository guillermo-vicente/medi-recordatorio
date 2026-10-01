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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/features/auth/useAuth';
import { useTheme } from '../src/theme/useTheme';
import { validateRegisterInput } from '../src/utils/validators';

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const theme = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleRegister = async () => {
        const validationErrors = validateRegisterInput(
            name,
            email,
            password,
            confirmPassword
        );
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors([]);
        setSubmitting(true);
        try {
            await signUp(name, email, password);
            router.replace('/home');
        } catch (e) {
            setErrors([e instanceof Error ? e.message : 'Error desconocido']);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
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
                        Crear Cuenta
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
                        Registrate para empezar a usar la app
                    </Text>

                    <View style={[styles.formCard, { backgroundColor: theme.colors.card }]}>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg }]}>
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Nombre"
                                placeholderTextColor={theme.colors.subtext}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                editable={!submitting}
                            />
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg }]}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Correo electronico"
                                placeholderTextColor={theme.colors.subtext}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!submitting}
                            />
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg }]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Contrasena (minimo 6 caracteres)"
                                placeholderTextColor={theme.colors.subtext}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!submitting}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword((v) => !v)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color={showPassword ? theme.colors.primary : theme.colors.subtext}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg }]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Confirmar contrasena"
                                placeholderTextColor={theme.colors.subtext}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                editable={!submitting}
                            />
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
                                styles.registerButton,
                                { backgroundColor: theme.colors.primary },
                                submitting && styles.disabled,
                            ]}
                            onPress={handleRegister}
                            activeOpacity={0.8}
                            disabled={submitting}
                        >
                            <Text style={styles.registerButtonText}>
                                {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
                            </Text>
                            <Ionicons name="checkmark-outline" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => router.back()}
                            disabled={submitting}
                        >
                            <Text style={[styles.loginText, { color: theme.colors.subtext }]}>
                                Ya tenes cuenta?{' '}
                                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                                    Inicia sesion
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    scroll: { paddingHorizontal: 24, paddingVertical: 20 },
    backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
    title: { fontSize: 28, fontWeight: '800' },
    subtitle: { fontSize: 15, marginTop: 4, marginBottom: 24 },
    formCard: { borderRadius: 24, padding: 24 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        height: 54,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 15 },
    errorContainer: { marginBottom: 12 },
    errorText: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        height: 54,
        marginTop: 8,
        gap: 8,
    },
    disabled: { opacity: 0.6 },
    registerButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    loginLink: { alignItems: 'center', marginTop: 20 },
    loginText: { fontSize: 14 },
});