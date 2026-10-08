import { useEffect, useRef, useState } from 'react';
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
import { validateLoginInput } from '../src/utils/validators';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isAuthenticated } = useAuth();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const passwordInput = useRef<TextInput>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    const validationErrors = validateLoginInput(email, password);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace('/home');
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Error desconocido']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Ionicons name="medkit-outline" size={48} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            MediRecordatorio
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            Tu recordatorio de medicamentos
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>
            Iniciar Sesion
          </Text>

          <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
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
              returnKeyType="next"
              onSubmitEditing={() => passwordInput.current?.focus()}
              editable={!submitting}
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
              placeholder="Contrasena"
              placeholderTextColor={theme.colors.subtext}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
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

          {errors.length > 0 && (
            <View style={styles.errorContainer}>
              {errors.map((err, i) => (
                <Text key={i} style={[styles.errorText, { color: theme.colors.danger }]}>
                  {err}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.colors.primary },
              submitting && styles.disabled,
            ]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={submitting}
          >
            <Text style={styles.loginButtonText}>
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </Text>
            <Ionicons name="arrow-forward-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/register')}
            disabled={submitting}
          >
            <Text style={[styles.registerText, { color: theme.colors.subtext }]}>
              No tenes cuenta?{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                Registrate
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  header: { alignItems: 'center', marginBottom: 26 },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#102326',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 5 },
  formCard: { borderRadius: 22, padding: 22, borderWidth: 1 },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
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
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 54,
    marginTop: 8,
    gap: 8,
  },
  disabled: { opacity: 0.6 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerText: { fontSize: 14 },
});
