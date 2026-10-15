import { useRef, useState } from 'react';
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
    const emailInput = useRef<TextInput>(null);
    const passwordInput = useRef<TextInput>(null);
    const confirmPasswordInput = useRef<TextInput>(null);

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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
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

                    <View style={styles.brandRow}>
                        <View style={[styles.brandMark, { backgroundColor: theme.colors.primary }]}>
                            <Ionicons name="medkit-outline" size={28} color={theme.colors.onPrimary} />
                        </View>
                        <View style={styles.brandText}>
                            <Text style={[styles.brandName, { color: theme.colors.text }]}>MediRecordatorio</Text>
                            <Text style={[styles.brandSubtitle, { color: theme.colors.subtext }]}>Tu recordatorio de medicamentos</Text>
                        </View>
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
                        Crear cuenta
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
                        Registrate para empezar a usar la app
                    </Text>

                    <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
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
                                returnKeyType="next"
                                onSubmitEditing={() => emailInput.current?.focus()}
                                editable={!submitting}
                                accessibilityLabel="Nombre"
                            />
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                ref={emailInput}
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Correo electrónico"
                                placeholderTextColor={theme.colors.subtext}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordInput.current?.focus()}
                                editable={!submitting}
                                accessibilityLabel="Correo electrónico"
                            />
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                ref={passwordInput}
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Contraseña (mínimo 6 caracteres)"
                                placeholderTextColor={theme.colors.subtext}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="next"
                                onSubmitEditing={() => confirmPasswordInput.current?.focus()}
                                editable={!submitting}
                                accessibilityLabel="Contraseña"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword((v) => !v)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                accessibilityRole="button"
                                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color={showPassword ? theme.colors.primary : theme.colors.subtext}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                ref={confirmPasswordInput}
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Confirmar contraseña"
                                placeholderTextColor={theme.colors.subtext}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="go"
                                onSubmitEditing={handleRegister}
                                editable={!submitting}
                                accessibilityLabel="Confirmar contraseña"
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
                            accessibilityRole="button"
                        >
                            <Text style={[styles.registerButtonText, { color: theme.colors.onPrimary }]}>
                                {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
                            </Text>
                            <Ionicons name="checkmark-outline" size={20} color={theme.colors.onPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => router.back()}
                            disabled={submitting}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.loginText, { color: theme.colors.subtext }]}>
                                ¿Ya tenés cuenta?{' '}
                                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                                    Iniciá sesión
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
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 },
    backBtn: { minWidth: 44, minHeight: 44, marginBottom: 16, alignSelf: 'flex-start', justifyContent: 'center' },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    brandMark: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    brandText: { flex: 1 },
    brandName: { fontSize: 18, fontWeight: '800' },
    brandSubtitle: { fontSize: 13, marginTop: 3 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, marginTop: 4, marginBottom: 24 },
    formCard: { borderRadius: 22, padding: 22, borderWidth: 1 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        height: 54,
        borderWidth: 1,
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
    registerButtonText: { fontSize: 16, fontWeight: '700' },
    loginLink: { alignItems: 'center', marginTop: 20 },
    loginText: { fontSize: 14 },
});
