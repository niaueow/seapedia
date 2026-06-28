"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../auth/auth-context";
import { RoleSelectorModal } from "../../auth/RoleSelectorModal";
import { useToast } from "../../components/toast";

type RoleName = "ADMIN" | "SELLER" | "BUYER" | "DRIVER";

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginInner />
        </Suspense>
    );
}

function LoginInner() {
    const router = useRouter();
    const params = useSearchParams();
    const next = params.get("next");
    const dest = next && next.startsWith("/") ? next : "/dashboard";
    const { login, selectRole } = useAuth();
    const toast = useToast();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // For the multi-role flow:
    const [needsRole, setNeedsRole] = useState(false);
    const [roles, setRoles] = useState<RoleName[]>([]);

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            const result = await login(username, password);
            if (result.requiresRoleSelection) {
                setRoles(result.roles);
                setNeedsRole(true); // show the modal
            } else {
                router.push(dest); // single-role: go to intended page
            }
        } catch (e: any) {
            const msg = e?.message ?? "Gagal masuk.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChosen(role: RoleName) {
        await selectRole(role);
        setNeedsRole(false);
        router.push(dest);
    }

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="brand-wordmark">
                    SEA<span>PEDIA</span>
                </div>
                <p className="muted" style={{ marginBottom: 8 }}>
                    Masuk ke akunmu
                </p>

                <div className="field">
                    <label htmlFor="username">Nama pengguna</label>
                    <input
                        id="username"
                        className="input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="cth: buyer"
                        autoComplete="username"
                    />
                </div>

                <div className="field">
                    <label htmlFor="password">Kata sandi</label>
                    <input
                        id="password"
                        className="input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSubmit();
                        }}
                    />
                </div>

                {error && <div className="form-error">{error}</div>}

                <button
                    className="btn btn-primary btn-lg btn-full"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Memproses…" : "Masuk"}
                </button>

                <p className="form-foot">
                    Belum punya akun? <Link href="/register">Daftar</Link>
                </p>
            </div>

            {needsRole && (
                <RoleSelectorModal roles={roles} onSelect={handleRoleChosen} />
            )}
        </div>
    );
}