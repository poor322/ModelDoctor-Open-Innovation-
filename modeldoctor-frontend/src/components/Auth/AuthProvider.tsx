/* ────────────────────────────────────────
   AuthProvider — React Context for authentication state
   ──────────────────────────────────────── */

"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import {
    AuthUser,
    getMe,
    loginUser,
    registerUser,
    clearToken,
    getToken,
} from "@/lib/auth";

// ───── Context Shape ─────

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ───── Provider ─────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate session on mount
    useEffect(() => {
        const token = getToken();
        if (!token) {
            setIsLoading(false);
            return;
        }

        getMe()
            .then(setUser)
            .catch(() => {
                clearToken();
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        const res = await loginUser(username, password);
        setUser(res.user);
    }, []);

    const register = useCallback(
        async (username: string, email: string, password: string) => {
            const res = await registerUser(username, email, password);
            setUser(res.user);
        },
        []
    );

    const logout = useCallback(() => {
        clearToken();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ───── Hook ─────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
