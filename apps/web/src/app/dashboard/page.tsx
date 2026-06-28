"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../auth/auth-context";
import { api, ApiError } from "../../lib/api";
import { formatIDR, ROLE_LABELS, type RoleName } from "../../lib/format";

type Store = { id: string; name: string; description: string | null } | null;

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <main className="page">
                    <div className="container">
                        <div className="loading-row">
                            <span className="spinner" aria-hidden /> Memuat…
                        </div>
                    </div>
                </main>
            }
        >
            <DashboardInner />
        </Suspense>
    );
}

function DashboardInner() {
    const { user, loading, selectRole } = useAuth();
    const router = useRouter();
    const params = useSearchParams();
    const denied = params.get("denied");

    const [balance, setBalance] = useState<number | null>(null);
    const [store, setStore] = useState<Store>(null);
    const [storeLoaded, setStoreLoaded] = useState(false);
    const [switching, setSwitching] = useState<RoleName | null>(null);

    const activeRole = user?.activeRole ?? null;

    // Redirect anonymous users to login.
    useEffect(() => {
        if (!loading && !user) router.replace("/login?next=%2Fdashboard");
    }, [loading, user, router]);

    // Buyer: balance summary.
    useEffect(() => {
        if (activeRole !== "BUYER") return;
        api<{ balance: number }>("/wallet")
            .then((w) => setBalance(w.balance))
            .catch(() => setBalance(null));
    }, [activeRole]);

    // Seller: store summary.
    useEffect(() => {
        if (activeRole !== "SELLER") return;
        api<Store>("/stores/mine")
            .then((s) => setStore(s))
            .catch(() => setStore(null))
            .finally(() => setStoreLoaded(true));
    }, [activeRole]);

    async function handleSwitch(role: RoleName) {
        setSwitching(role);
        try {
            await selectRole(role);
        } catch (e) {
            // ignore; selection only fails if role not owned
            void (e as ApiError);
        } finally {
            setSwitching(null);
        }
    }

    if (loading || !user) {
        return (
            <main className="page">
                <div className="container">
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat…
                    </div>
                </div>
            </main>
        );
    }

    const otherRoles = user.roles.filter(
        (r) => r !== activeRole && r !== "ADMIN",
    );

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Halo, {user.username}</h1>
                        <p className="page-sub">
                            Kelola aktivitasmu di Seapedia sesuai peran yang sedang aktif.
                        </p>
                    </div>
                </div>

                {denied && (
                    <div className="notice notice-warn" role="status">
                        Halaman itu hanya untuk peran tertentu (
                        {denied
                            .split(",")
                            .map((r) => ROLE_LABELS[r as RoleName] ?? r)
                            .join(", ")}
                        ). Ganti peran aktifmu untuk membukanya.
                    </div>
                )}

                {/* ── Roles + active role ── */}
                <div className="panel" style={{ marginTop: 18 }}>
                    <p className="panel-title">Peran akun</p>
                    <p className="muted" style={{ fontSize: "0.9rem" }}>
                        Satu akun bisa punya beberapa peran. Kamu bertindak dengan satu
                        peran aktif setiap sesi.
                    </p>
                    <div className="role-options" style={{ marginTop: 14 }}>
                        {user.roles.map((r) => (
                            <span
                                key={r}
                                className={`role-pill ${r === activeRole ? "is-on" : ""}`}
                            >
                                {r === activeRole ? "✓ " : ""}
                                {ROLE_LABELS[r as RoleName] ?? r}
                                {r === activeRole ? " (aktif)" : ""}
                            </span>
                        ))}
                    </div>

                    {otherRoles.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 8 }}>
                                Ganti peran aktif:
                            </p>
                            <div className="field-row">
                                {otherRoles.map((r) => (
                                    <button
                                        key={r}
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleSwitch(r as RoleName)}
                                        disabled={switching !== null}
                                    >
                                        {switching === r
                                            ? "Mengganti…"
                                            : `Jadi ${ROLE_LABELS[r as RoleName] ?? r}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Role-specific summaries ── */}
                {activeRole === "BUYER" && (
                    <div className="grid-2" style={{ marginTop: 18 }}>
                        <div className="panel">
                            <p className="field-label">Saldo dompet</p>
                            <div className="price" style={{ fontSize: "2rem", marginTop: 6 }}>
                                {balance === null ? "Rp0" : formatIDR(balance)}
                            </div>
                            <p className="muted" style={{ fontSize: "0.88rem", marginTop: 6 }}>
                                Saldo dompet untuk membayar pesanan.
                            </p>
                            <div className="field-row" style={{ marginTop: 16 }}>
                                <Link href="/wallet" className="btn btn-primary btn-sm">
                                    Isi saldo
                                </Link>
                                <Link href="/orders" className="btn btn-outline btn-sm">
                                    Riwayat pesanan
                                </Link>
                            </div>
                        </div>
                        <div className="panel">
                            <p className="panel-title">Aksi cepat</p>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <Link href="/products" className="nav-link">Jelajahi produk</Link>
                                <Link href="/cart" className="nav-link">Keranjang</Link>
                                <Link href="/addresses" className="nav-link">Alamat pengiriman</Link>
                                <Link href="/orders" className="nav-link">Pesanan saya</Link>
                            </div>
                        </div>
                    </div>
                )}

                {activeRole === "SELLER" && (
                    <div className="grid-2" style={{ marginTop: 18 }}>
                        <div className="panel">
                            <p className="field-label">Toko kamu</p>
                            {!storeLoaded ? (
                                <div className="loading-row" style={{ padding: 16 }}>
                                    <span className="spinner" aria-hidden /> Memuat…
                                </div>
                            ) : store ? (
                                <>
                                    <div className="display" style={{ fontSize: "1.4rem", marginTop: 6 }}>
                                        {store.name}
                                    </div>
                                    <p className="muted" style={{ fontSize: "0.88rem", marginTop: 6 }}>
                                        {store.description || "Belum ada deskripsi toko."}
                                    </p>
                                    <div className="field-row" style={{ marginTop: 16 }}>
                                        <Link href="/seller/products" className="btn btn-primary btn-sm">
                                            Kelola produk
                                        </Link>
                                        <Link href="/seller/store" className="btn btn-outline btn-sm">
                                            Edit toko
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="muted" style={{ fontSize: "0.9rem", marginTop: 6 }}>
                                        Kamu belum punya toko. Buat toko untuk mulai berjualan.
                                    </p>
                                    <Link
                                        href="/seller/store"
                                        className="btn btn-primary btn-sm"
                                        style={{ marginTop: 16 }}
                                    >
                                        Buat toko
                                    </Link>
                                </>
                            )}
                        </div>
                        <div className="panel">
                            <p className="panel-title">Aksi cepat</p>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <Link href="/seller/store" className="nav-link">Profil toko</Link>
                                <Link href="/seller/products" className="nav-link">Produk saya</Link>
                                <Link href="/seller/orders" className="nav-link">Pesanan masuk</Link>
                                <Link href="/products" className="nav-link">Lihat katalog publik</Link>
                            </div>
                        </div>
                    </div>
                )}

                {(activeRole === "DRIVER" || activeRole === "ADMIN") && (
                    <div className="panel" style={{ marginTop: 18 }}>
                        <p className="panel-title">
                            {activeRole === "DRIVER" ? "Kurir" : "Admin"}
                        </p>
                        <p className="muted" style={{ fontSize: "0.9rem" }}>
                            Fitur untuk peran ini akan hadir pada tahap berikutnya. Untuk
                            saat ini kamu tetap bisa menjelajahi katalog publik.
                        </p>
                        <Link
                            href="/products"
                            className="btn btn-outline btn-sm"
                            style={{ marginTop: 14 }}
                        >
                            Lihat produk
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
