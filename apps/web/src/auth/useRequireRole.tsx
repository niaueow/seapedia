"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import type { RoleName } from "../lib/format";

type GuardState = {
    ready: boolean; // true once auth resolved AND the active role matches
    reason: "loading" | "anon" | "wrong-role" | "ok";
};

/**
 * Client-side route guard. The backend is the real authority; this only
 * improves UX by redirecting users who shouldn't be on a role page.
 *
 * - waits for useAuth().loading
 * - not logged in           -> /login?next=<path>
 * - logged in, wrong role   -> /dashboard (with a hint)
 */
export function useRequireRole(allow: RoleName | RoleName[]): GuardState {
    const allowed = Array.isArray(allow) ? allow : [allow];
    const { user, loading } = useAuth();
    const router = useRouter();

    const active = user?.activeRole ?? null;
    const ok = !!user && !!active && allowed.includes(active);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            const next =
                typeof window !== "undefined"
                    ? encodeURIComponent(window.location.pathname)
                    : "";
            router.replace(`/login${next ? `?next=${next}` : ""}`);
            return;
        }
        if (!ok) {
            router.replace(`/dashboard?denied=${allowed.join(",")}`);
        }
    }, [loading, user, ok, router, allowed]);

    if (loading) return { ready: false, reason: "loading" };
    if (!user) return { ready: false, reason: "anon" };
    if (!ok) return { ready: false, reason: "wrong-role" };
    return { ready: true, reason: "ok" };
}

/**
 * Renders a full-page loading shell while the guard resolves so role pages
 * never flash protected content before the redirect kicks in.
 */
export function GuardGate({ state }: { state: GuardState }) {
    return (
        <main className="mx-auto max-w-[1280px] px-6 py-12">
            <div className="mt-20 flex items-center justify-center gap-3 text-foreground/50">
                <span className="spinner" aria-hidden />
                {state.reason === "wrong-role" ? "Mengalihkan…" : "Memuat…"}
            </div>
        </main>
    );
}
