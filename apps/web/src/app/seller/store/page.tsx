"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../lib/api";
import { useRequireRole, GuardGate } from "../../../auth/useRequireRole";

type Store = {
    id: string;
    name: string;
    description: string | null;
};

export default function SellerStorePage() {
    const guard = useRequireRole("SELLER");

    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setLoadError(null);
        try {
            const s = await api<Store | null>("/stores/mine");
            setStore(s);
            if (s) {
                setName(s.name);
                setDescription(s.description ?? "");
            }
        } catch {
            setLoadError("Gagal memuat data toko.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (guard.ready) load();
    }, [guard.ready]);

    if (!guard.ready) return <GuardGate state={guard} />;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setSuccess(null);
        if (!name.trim()) {
            setFormError("Nama toko wajib diisi.");
            return;
        }
        setSaving(true);
        const body = {
            name: name.trim(),
            description: description.trim() || undefined,
        };
        try {
            if (store) {
                const updated = await api<Store>(`/stores/${store.id}`, {
                    method: "PATCH",
                    body,
                });
                setStore(updated);
                setSuccess("Perubahan toko tersimpan.");
            } else {
                const created = await api<Store>("/stores", { method: "POST", body });
                setStore(created);
                setSuccess("Toko berhasil dibuat!");
            }
        } catch (e) {
            const err = e as ApiError;
            if (err.status === 409) {
                setFormError(
                    err.message?.toLowerCase().includes("already")
                        ? err.message
                        : "Nama toko sudah dipakai. Pilih nama lain.",
                );
            } else {
                setFormError(err.message || "Gagal menyimpan toko.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Toko</p>
                        <h1 className="page-title">
                            {store ? "Profil toko" : "Buat toko"}
                        </h1>
                        <p className="page-sub">
                            {store
                                ? "Perbarui identitas tokomu di Seapedia."
                                : "Buat toko untuk mulai berjualan. Nama toko harus unik."}
                        </p>
                    </div>
                </div>

                {loadError && <div className="notice notice-danger">{loadError}</div>}

                {loading ? (
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat…
                    </div>
                ) : (
                    <div className="grid-2">
                        <form className="panel" onSubmit={handleSubmit}>
                            <div className="field">
                                <label htmlFor="store-name">Nama toko</label>
                                <input
                                    id="store-name"
                                    className="input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="cth: Toko Maju Jaya"
                                    maxLength={80}
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="store-desc">Deskripsi (opsional)</label>
                                <textarea
                                    id="store-desc"
                                    className="textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ceritakan tentang tokomu…"
                                    maxLength={500}
                                />
                            </div>

                            {formError && <div className="notice notice-danger">{formError}</div>}
                            {success && <div className="notice notice-success">{success}</div>}

                            <button className="btn btn-primary btn-full" type="submit" disabled={saving}>
                                {saving
                                    ? "Menyimpan…"
                                    : store
                                        ? "Simpan perubahan"
                                        : "Buat toko"}
                            </button>
                        </form>

                        <div className="panel">
                            <p className="panel-title">
                                {store ? "Toko aktif" : "Belum punya toko"}
                            </p>
                            {store ? (
                                <>
                                    <div className="display" style={{ fontSize: "1.3rem", marginTop: 4 }}>
                                        {store.name}
                                    </div>
                                    <p className="muted" style={{ fontSize: "0.9rem", marginTop: 6 }}>
                                        {store.description || "Belum ada deskripsi."}
                                    </p>
                                    <div className="field-row" style={{ marginTop: 16 }}>
                                        <Link href="/seller/products" className="btn btn-primary btn-sm">
                                            Kelola produk
                                        </Link>
                                        <Link href={`/products?storeId=${store.id}`} className="btn btn-outline btn-sm">
                                            Lihat halaman publik
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <p className="muted" style={{ fontSize: "0.9rem" }}>
                                    Isi formulir di samping untuk membuat tokomu. Setelah toko
                                    dibuat, kamu bisa menambahkan produk.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
