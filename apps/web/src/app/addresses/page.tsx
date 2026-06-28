"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { useToast } from "../../components/toast";

type Address = {
    id: string;
    label: string | null;
    recipientName: string;
    phone: string;
    fullAddress: string;
    city: string | null;
    postalCode: string | null;
    isDefault: boolean;
};

type FormState = {
    label: string;
    recipientName: string;
    phone: string;
    fullAddress: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
};

const EMPTY: FormState = {
    label: "",
    recipientName: "",
    phone: "",
    fullAddress: "",
    city: "",
    postalCode: "",
    isDefault: false,
};

export default function AddressesPage() {
    const guard = useRequireRole("BUYER");
    const toast = useToast();

    const [items, setItems] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            setItems(await api<Address[]>("/addresses"));
        } catch {
            setError("Gagal memuat alamat.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (guard.ready) load();
    }, [guard.ready]);

    if (!guard.ready) return <GuardGate state={guard} />;

    function openCreate() {
        setEditId(null);
        setForm({ ...EMPTY, isDefault: items.length === 0 });
        setFormError(null);
        setModalOpen(true);
    }

    function openEdit(a: Address) {
        setEditId(a.id);
        setForm({
            label: a.label ?? "",
            recipientName: a.recipientName,
            phone: a.phone,
            fullAddress: a.fullAddress,
            city: a.city ?? "",
            postalCode: a.postalCode ?? "",
            isDefault: a.isDefault,
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
        if (!form.recipientName.trim() || !form.phone.trim() || !form.fullAddress.trim()) {
            setFormError("Nama penerima, nomor telepon, dan alamat lengkap wajib diisi.");
            return;
        }
        setSubmitting(true);
        const body = {
            label: form.label.trim() || undefined,
            recipientName: form.recipientName.trim(),
            phone: form.phone.trim(),
            fullAddress: form.fullAddress.trim(),
            city: form.city.trim() || undefined,
            postalCode: form.postalCode.trim() || undefined,
            isDefault: form.isDefault,
        };
        try {
            if (editId) {
                await api(`/addresses/${editId}`, { method: "PATCH", body });
            } else {
                await api("/addresses", { method: "POST", body });
            }
            setModalOpen(false);
            toast.success(editId ? "Alamat diperbarui." : "Alamat ditambahkan.");
            await load();
        } catch (e) {
            const msg = (e as ApiError).message || "Gagal menyimpan alamat.";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    async function setDefault(a: Address) {
        setBusyId(a.id);
        try {
            await api(`/addresses/${a.id}`, { method: "PATCH", body: { isDefault: true } });
            toast.success("Alamat utama diperbarui.");
            await load();
        } catch {
            toast.error("Gagal mengatur alamat utama.");
        } finally {
            setBusyId(null);
        }
    }

    async function remove(a: Address) {
        if (!confirm("Hapus alamat ini?")) return;
        setBusyId(a.id);
        try {
            await api(`/addresses/${a.id}`, { method: "DELETE" });
            toast.success("Alamat dihapus.");
            await load();
        } catch {
            toast.error("Gagal menghapus alamat.");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Alamat pengiriman</h1>
                        <p className="page-sub">
                            Kelola alamat untuk pengiriman pesananmu.
                        </p>
                    </div>
                    <button className="btn btn-primary btn-md" onClick={openCreate}>
                        + Tambah alamat
                    </button>
                </div>

                {error && <div className="notice notice-danger">{error}</div>}

                {loading ? (
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat…
                    </div>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📍</div>
                        <div>
                            <h3 className="empty-state-title">Belum ada alamat</h3>
                            <p className="empty-state-body">
                                Tambahkan alamat pengiriman agar bisa checkout.
                            </p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}>
                            Tambah alamat
                        </button>
                    </div>
                ) : (
                    <div className="review-grid">
                        {items.map((a) => (
                            <div key={a.id} className="panel" style={{ marginTop: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                    <span className="list-row-title">
                                        {a.label || "Alamat"}
                                    </span>
                                    {a.isDefault && <span className="chip">Utama</span>}
                                </div>
                                <p style={{ marginTop: 8, fontWeight: 600 }}>{a.recipientName}</p>
                                <p className="muted" style={{ fontSize: "0.88rem" }}>{a.phone}</p>
                                <p className="muted" style={{ fontSize: "0.88rem", marginTop: 6, overflowWrap: "anywhere" }}>
                                    {a.fullAddress}
                                    {a.city ? `, ${a.city}` : ""}
                                    {a.postalCode ? ` ${a.postalCode}` : ""}
                                </p>
                                <div className="field-row" style={{ marginTop: 14 }}>
                                    {!a.isDefault && (
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => setDefault(a)}
                                            disabled={busyId === a.id}
                                        >
                                            Jadikan utama
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => openEdit(a)}
                                        disabled={busyId === a.id}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: "var(--danger)" }}
                                        onClick={() => remove(a)}
                                        disabled={busyId === a.id}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
                    <form
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleSubmit}
                        style={{ maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
                    >
                        <h2 className="display" style={{ fontSize: "1.4rem" }}>
                            {editId ? "Edit alamat" : "Tambah alamat"}
                        </h2>

                        <div className="field">
                            <label htmlFor="label">Label (opsional)</label>
                            <input id="label" className="input" value={form.label} onChange={(e) => update("label", e.target.value)} placeholder="cth: Rumah, Kantor" />
                        </div>
                        <div className="field">
                            <label htmlFor="recipient">Nama penerima</label>
                            <input id="recipient" className="input" value={form.recipientName} onChange={(e) => update("recipientName", e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="phone">Nomor telepon</label>
                            <input id="phone" className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="cth: 0812xxxx" />
                        </div>
                        <div className="field">
                            <label htmlFor="addr">Alamat lengkap</label>
                            <textarea id="addr" className="textarea" value={form.fullAddress} onChange={(e) => update("fullAddress", e.target.value)} />
                        </div>
                        <div className="field-row">
                            <div className="field">
                                <label htmlFor="city">Kota (opsional)</label>
                                <input id="city" className="input" value={form.city} onChange={(e) => update("city", e.target.value)} />
                            </div>
                            <div className="field">
                                <label htmlFor="postal">Kode pos (opsional)</label>
                                <input id="postal" className="input" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
                            </div>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: "0.9rem", cursor: "pointer" }}>
                            <input type="checkbox" checked={form.isDefault} onChange={(e) => update("isDefault", e.target.checked)} />
                            Jadikan alamat utama
                        </label>

                        {formError && <div className="notice notice-danger">{formError}</div>}

                        <div className="field-row" style={{ marginTop: 20 }}>
                            <button type="button" className="btn btn-ghost btn-md" onClick={() => setModalOpen(false)} disabled={submitting}>
                                Batal
                            </button>
                            <button type="submit" className="btn btn-primary btn-md" style={{ flex: 1 }} disabled={submitting}>
                                {submitting ? "Menyimpan…" : "Simpan"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
