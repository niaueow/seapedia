"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { api } from "../lib/api";

type RoleName = "ADMIN" | "SELLER" | "BUYER" | "DRIVER";

type AuthUser = {
    id: string;
    username: string;
    roles: RoleName[];
    activeRole: RoleName | null;
};

type LoginResult = {
    requiresRoleSelection: boolean;
    roles: RoleName[];
};

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<LoginResult>;
    selectRole: (role: RoleName) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "seapedia_token";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // On first load, if we have a saved token, fetch the profile.
    useEffect(() => {
        const token = window.localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setLoading(false);
            return;
        }
        api<AuthUser>("/auth/profile")
            .then((profile) => setUser(profile))
            .catch(() => {
                // Token invalid/expired -> clear it.
                window.localStorage.removeItem(TOKEN_KEY);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    async function login(username: string, password: string) {
        const result = await api<{
            accessToken: string;
            requiresRoleSelection: boolean;
            roles: RoleName[];
            user: { id: string; username: string };
        }>("/auth/login", {
            method: "POST",
            body: { username, password },
            auth: false,
        });

        window.localStorage.setItem(TOKEN_KEY, result.accessToken);

        // Load the full profile (gives us roles + activeRole from the token).
        const profile = await api<AuthUser>("/auth/profile");
        setUser(profile);

        return {
            requiresRoleSelection: result.requiresRoleSelection,
            roles: result.roles,
        };
    }

    async function selectRole(role: RoleName) {
        const result = await api<{ accessToken: string; activeRole: RoleName }>(
            "/auth/select-role",
            { method: "POST", body: { role } },
        );
        window.localStorage.setItem(TOKEN_KEY, result.accessToken);
        const profile = await api<AuthUser>("/auth/profile");
        setUser(profile);
    }

    async function logout() {
        try {
            await api("/auth/logout", { method: "POST" });
        } catch {
            // ignore errors; we clear locally regardless
        }
        window.localStorage.removeItem(TOKEN_KEY);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, selectRole, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// A small hook so any component can read auth easily.
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}