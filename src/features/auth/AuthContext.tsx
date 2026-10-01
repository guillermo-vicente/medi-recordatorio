// Maneja el estado global de autenticacion.
// Persiste usuarios en AsyncStorage y el token cifrado en SecureStore.

import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { tokenStorage } from '../../services/secureStorage';
import { storage } from '../../services/storage';
import { STORAGE_KEYS } from '../../config/constants';


export interface AuthUser {
    email: string;
    name: string;
}


interface StoredUser extends AuthUser {
    password: string;
}


export interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (name: string, email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}


export const AuthContext = createContext<AuthContextValue | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const bootstrap = async () => {
            try {
                const token = await tokenStorage.get();
                const storedUser = await storage.get<AuthUser | null>(
                    STORAGE_KEYS.CURRENT_USER,
                    null
                );
                if (token && storedUser) {
                    setUser(storedUser);
                }
            } catch (e) {
                console.warn('[auth] bootstrap failed:', e);
            } finally {
                setIsLoading(false);
            }
        };
        bootstrap();
    }, []);


    const signIn = useCallback(async (email: string, password: string) => {
        const normalized = email.trim().toLowerCase();
        const users = await storage.get<StoredUser[]>(STORAGE_KEYS.USERS, []);
        const found = users.find(
            (u) => u.email === normalized && u.password === password
        );
        if (!found) {
            throw new Error('Credenciales incorrectas');
        }
        const authUser: AuthUser = { email: found.email, name: found.name };
        await tokenStorage.set(`simulated_token_${normalized}`);
        await storage.set(STORAGE_KEYS.CURRENT_USER, authUser);
        setUser(authUser);
    }, []);


    const signUp = useCallback(
        async (name: string, email: string, password: string) => {
            const normalized = email.trim().toLowerCase();
            const users = await storage.get<StoredUser[]>(STORAGE_KEYS.USERS, []);
            if (users.some((u) => u.email === normalized)) {
                throw new Error('Ya existe una cuenta con ese email');
            }
            const newUser: StoredUser = { name: name.trim(), email: normalized, password };
            await storage.set(STORAGE_KEYS.USERS, [...users, newUser]);
            const authUser: AuthUser = { email: newUser.email, name: newUser.name };
            await tokenStorage.set(`simulated_token_${normalized}`);
            await storage.set(STORAGE_KEYS.CURRENT_USER, authUser);
            setUser(authUser);
        },
        []
    );


    const signOut = useCallback(async () => {
        await tokenStorage.remove();
        await storage.remove(STORAGE_KEYS.CURRENT_USER);
        setUser(null);
    }, []);


    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: user !== null,
            isLoading,
            signIn,
            signUp,
            signOut,
        }),
        [user, isLoading, signIn, signUp, signOut]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
