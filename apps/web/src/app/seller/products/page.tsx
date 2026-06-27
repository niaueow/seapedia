"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../lib/api";
import { useRequireRole, GuardGate } from "../../../auth/useRequireRole";
import { formatIDR } from "../../../lib/format";

type Product = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
    isActive: boolean;
};

type ProductList = {
    data: Product[];
    page: number;
    limit: number;
    total: number;
};

type FormState = {
    name: string;
    description: string;
    price: string;
    stock: string;
    imageUrl: string;
    isActive: boolean;
};

const EMPTY: FormState = {
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    isActive: true,
};

const LIMIT = 10;

export default function SellerProductsPage() {
    const guard = useRequireRole("SELLER");

    const [list, setList] = useState<ProductList | null>(null);
    const [hasStore, setHasStore] = useState<boolean | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [store, products] = await Promise.all([
                api<{ id: string } | null>("/stores/mine"),
                api<ProductList>(`/products/mine?page=${page}&limit=${LIMIT}`),
            ]);
            setHasStore(!!store);
            setList(products);
        } catch {
            setError("Gagal memuat produk.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (guard.ready) load();
    }, [guard.ready, page]);

    if (!guard.ready) return <GuardGate state={guard} />;

    function openCreate() {
        setEditId(null);
        setForm(EMPTY);
        setFormError(null);
        setModalOpen(true);
    }

    function openEdit(p: Product) {
        setEditId(p.id);
        setForm({
            name: p.name,
            description: p.description ?? "",
            price: String(p.price),
            stock: String(p.stock),
            imageUrl: p.imageUrl ?? "",
            isActive: p.isActive,
        });
        setFormError(null);
        setModalOpen(true);
    }

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        const price = Math.floor(Number(form.price));
        const stock = Math.floor(Number(form.stock));
        if (!form.name.trim()) {
            setFormError("Nama produk wajib diisi.");
            return;
        }
        if (!Number.isFinite(price) || price < 0) {
            setFormError("Harga harus berupa angka bulat ≥ 0.");
            return;
        }
        if (!Number.isFinite(stock) || stock < 0) {
            setFormError("Stok harus berupa angka bulat ≥ 0.");
            return;
        }
        setSaving(true);
        try {
            if (editId) {
                await api(`/products/${editId}`, {
                    method: "PATCH",
                    body: {
                        name: form.name.trim(),
                        description: form.description.trim() || undefined,
                        price,
                        stock,
                        imageUrl: form.imageUrl.trim() || undefined,
                        isActive: form.isActive,
                    },
                });
            } else {
                await api("/products", {
                    method: "POST",
                    body: {
                        name: form.name.trim(),
                        description: form.description.trim() || undefined,
                        price,
                        stock,
                        imageUrl: form.imageUrl.trim() || undefined,
                    },
                });
            }
            setModalOpen(false);
            await load();
        } catch (e) {
            setFormError((e as ApiError).message || "Gagal menyimpan produk.");
        } finally {
            setSaving(false);
        }
    }

    async function softDelete(p: Product) {
        if (!confirm(`Nonaktifkan "${p.name}"? Produk akan disembunyikan dari katalog.`)) return;
        setBusyId(p.id);
        try {
            await api(`/products/${p.id}`, { method: "DELETE" });
            await load();
        } catch {
            setError("Gagal menghapus produk.");
        } finally {
            setBusyId(null);
        }
    }

    async function reactivate(p: Product) {
        setBusyId(p.id);
        try {
            await api(`/products/${p.id}`, { method: "PATCH", body: { isActive: true } });
            await load();
        } catch {
            setError("Gagal mengaktifkan produk.");
        } finally {
            setBusyId(null);
        }
    }

    const totalPages = list ? Math.max(1, Math.ceil(list.total / LIMIT)) : 1;

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Produk</p>
                        <h1 className="page-title">Produk saya</h1>
                        <p className="page-sub">Kelola produk yang dijual di tokomu.</p>
                    </div>
                    {hasStore && (
                        <button className="btn btn-primary btn-md" onClick={openCreate}>
                            + Tambah produk
                        </button>
                    )}
                </div>

                {error && <div className="notice notice-danger">{error}</div>}

                {hasStore === false && (
                    <div className="notice notice-warn">
                        Kamu belum punya toko.{" "}
                        <Link href="/seller/store" style={{ fontWeight: 700, textDecoration: "underline", color: "inherit" }}>
                            Buat toko
                        </Link>{" "}
                        dulu sebelum menambahkan produk.
                    </div>
                )}

                {loading ? (
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat…
                    </div>
                ) : !list || list.data.length === 0 ? (
                    hasStore !== false && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📦</div>
                            <div>
                                <h3 className="empty-state-title">Belum ada produk</h3>
                                <p className="empty-state-body">
                                    Tambahkan produk pertamamu agar muncul di katalog publik.
                                </p>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={openCreate}>
                                Tambah produk
                            </button>
                        </div>
                    )
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Produk</th>
                                        <th>Harga</th>
                                        <th>Stok</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.data.map((p) => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatIDR(p.price)}</td>
                                            <td>{p.stock}</td>
                                            <td>
                                                <span className="chip" style={{ color: p.isActive ? "var(--success)" : "var(--danger)" }}>
                                                    {p.isActive ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} disabled={busyId === p.id}>
                                                    Edit
                                                </button>
                                                {p.isActive ? (
                                                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => softDelete(p)} disabled={busyId === p.id}>
                                                        Hapus
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--success)" }} onClick={() => reactivate(p)} disabled={busyId === p.id}>
                                                        Aktifkan
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="pager">
                                <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                    ← Sebelumnya
                                </button>
                                <span className="pager-info">Halaman {page} dari {totalPages}</span>
                                <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                    Berikutnya →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => !saving && setModalOpen(false)}>
                    <form
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleSubmit}
                        style={{ maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
                    >
                        <p className="eyebrow">{editId ? "Edit" : "Baru"}</p>
                        <h2 className="display" style={{ fontSize: "1.4rem", marginTop: 6 }}>
                            {editId ? "Edit produk" : "Tambah produk"}
                        </h2>

                        <div className="field">
                            <label htmlFor="p-name">Nama produk</label>
                            <input id="p-name" className="input" value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={120} />
                        </div>
                        <div className="field">
                            <label htmlFor="p-desc">Deskripsi (opsional)</label>
                            <textarea id="p-desc" className="textarea" value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={1000} />
                        </div>
                        <div className="field-row">
                            <div className="field">
                                <label htmlFor="p-price">Harga (Rp)</label>
                                <input id="p-price" className="input" type="number" min={0} step={1} value={form.price} onChange={(e) => update("price", e.target.value)} />
                            </div>
                            <div className="field">
                                <label htmlFor="p-stock">Stok</label>
                                <input id="p-stock" className="input" type="number" min={0} step={1} value={form.stock} onChange={(e) => update("stock", e.target.value)} />
                            </div>
                        </div>
                        <div className="field">
                            <label htmlFor="p-img">URL gambar (opsional)</label>
                            <input id="p-img" className="input" type="url" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="https://…" />
                        </div>
                        {editId && (
                            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: "0.9rem", cursor: "pointer" }}>
                                <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
                                Produk aktif (tampil di katalog)
                            </label>
                        )}

                        {formError && <div className="notice notice-danger">{formError}</div>}

                        <div className="field-row" style={{ marginTop: 20 }}>
                            <button type="button" className="btn btn-ghost btn-md" onClick={() => setModalOpen(false)} disabled={saving}>
                                Batal
                            </button>
                            <button type="submit" className="btn btn-primary btn-md" style={{ flex: 1 }} disabled={saving}>
                                {saving ? "Menyimpan…" : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
