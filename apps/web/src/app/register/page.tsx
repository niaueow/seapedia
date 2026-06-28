"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { useToast } from "../../components/toast";

type RoleName = "BUYER" | "SELLER" | "DRIVER";

const SELECTABLE_ROLES: { value: RoleName; label: string }[] = [
    { value: "BUYER", label: "Pembeli" },
    { value: "SELLER", label: "Penjual" },
    { value: "DRIVER", label: "Kurir" },
];

export default function RegisterPage() {
    const router = useRouter();
    const toast = useToast();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [roles, setRoles] = useState<RoleName[]>(["BUYER"]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function toggleRole(role: RoleName) {
        setRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
        );
    }

    async function handleSubmit() {
        setError(null);
        if (roles.length === 0) {
            setError("Pilih minimal satu peran.");
            toast.warning("Pilih minimal satu peran.");
            return;
        }
        setLoading(true);
        try {
            await api("/auth/register", {
                method: "POST",
                auth: false,
                body: { username, email, name: name || undefined, password, roles },
            });
            // Registered! Send them to login.
            toast.success("Akun berhasil dibuat. Silakan masuk.");
            router.push("/login");
        } catch (e: any) {
            const msg = e?.message ?? "Gagal mendaftar.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="brand-wordmark">
                    SEA<span>PEDIA</span>
                </div>
                <p className="muted" style={{ marginBottom: 8 }}>
                    Buat akun baru
                </p>

                <div className="field">
                    <label htmlFor="username">Nama pengguna</label>
                    <input
                        id="username"
                        className="input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="min. 3 karakter"
                        autoComplete="username"
                    />
                </div>

                <div className="field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        className="input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="kamu@contoh.com"
                        autoComplete="email"
                    />
                </div>

                <div className="field">
                    <label htmlFor="name">Nama lengkap (opsional)</label>
                    <input
                        id="name"
                        className="input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="cth: Budi Santoso"
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
                        placeholder="min. 6 karakter"
                        autoComplete="new-password"
                    />
                </div>

                <div className="field">
                    <label>Daftar sebagai</label>
                    <div className="role-options">
                        {SELECTABLE_ROLES.map((r) => (
                            <span
                                key={r.value}
                                className={`role-pill ${roles.includes(r.value) ? "is-on" : ""}`}
                                onClick={() => toggleRole(r.value)}
                                role="checkbox"
                                aria-checked={roles.includes(r.value)}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggleRole(r.value);
                                    }
                                }}
                            >
                                {roles.includes(r.value) ? "✓ " : ""}
                                {r.label}
                            </span>
                        ))}
                    </div>
                </div>

                {error && <div className="form-error">{error}</div>}

                <button
                    className="btn btn-primary btn-lg btn-full"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Mendaftar…" : "Daftar"}
                </button>

                <p className="form-foot">
                    Sudah punya akun? <Link href="/login">Masuk</Link>
                </p>
            </div>
        </div>
    );
}