"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { formatIDR, formatDateTime, WALLET_TXN_LABELS } from "../../lib/format";

type Txn = {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
};

type History = {
    data: Txn[];
    page: number;
    limit: number;
    total: number;
};

const LIMIT = 8;
const QUICK = [50000, 100000, 500000, 1000000];

export default function WalletPage() {
    const guard = useRequireRole("BUYER");

    const [balance, setBalance] = useState<number | null>(null);
    const [history, setHistory] = useState<History | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [w, h] = await Promise.all([
                api<{ balance: number }>("/wallet"),
                api<History>(`/wallet/history?page=${page}&limit=${LIMIT}`),
            ]);
            setBalance(w.balance);
            setHistory(h);
        } catch {
            setError("Gagal memuat dompet.");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (guard.ready) loadAll();
    }, [guard.ready, loadAll]);

    if (!guard.ready) return <GuardGate state={guard} />;

    async function handleTopup(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        const val = Math.floor(Number(amount));
        if (!Number.isFinite(val) || val < 1) {
            setFormError("Masukkan jumlah yang valid (minimal Rp 1).");
            return;
        }
        setSubmitting(true);
        try {
            const res = await api<{ balance: number }>("/wallet/topup", {
                method: "POST",
                body: { amount: val },
            });
            setBalance(res.balance);
            setModalOpen(false);
            setAmount("");
            setPage(1);
            await loadAll();
        } catch (e) {
            setFormError((e as ApiError).message || "Gagal mengisi saldo.");
        } finally {
            setSubmitting(false);
        }
    }

    const totalPages = history ? Math.max(1, Math.ceil(history.total / LIMIT)) : 1;

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Dompet</p>
                        <h1 className="page-title">Dompet saya</h1>
                        <p className="page-sub">
                            Isi saldo untuk membayar pesanan. Top-up bersifat simulasi.
                        </p>
                    </div>
                </div>

                {error && <div className="notice notice-danger">{error}</div>}

                {/* Balance card */}
                <div className="panel" style={{ background: "linear-gradient(130deg, var(--brand-dark), var(--brand-deeper))", border: "none" }}>
                    <p className="eyebrow" style={{ color: "rgba(255,255,255,.8)" }}>Saldo aktif</p>
                    <div style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                        {balance === null ? "—" : formatIDR(balance)}
                    </div>
                    <button
                        className="btn btn-on-brand btn-md"
                        style={{ marginTop: 18 }}
                        onClick={() => {
                            setFormError(null);
                            setModalOpen(true);
                        }}
                    >
                        + Isi saldo
                    </button>
                </div>

                {/* History */}
                <div className="panel">
                    <p className="panel-title">Riwayat transaksi</p>
                    {loading ? (
                        <div className="loading-row">
                            <span className="spinner" aria-hidden /> Memuat…
                        </div>
                    ) : !history || history.data.length === 0 ? (
                        <div className="empty-state" style={{ marginTop: 12 }}>
                            <div className="empty-state-icon">💸</div>
                            <div>
                                <h3 className="empty-state-title">Belum ada transaksi</h3>
                                <p className="empty-state-body">
                                    Mulai dengan mengisi saldo dompetmu.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {history.data.map((t) => {
                                const credit = t.type === "TOPUP" || t.type === "REFUND";
                                return (
                                    <div key={t.id} className="list-row">
                                        <div className="list-row-main">
                                            <span className="list-row-title">
                                                {WALLET_TXN_LABELS[t.type] ?? t.type}
                                            </span>
                                            <span className="list-row-meta">
                                                {t.description || "—"} · {formatDateTime(t.createdAt)}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div className={credit ? "amount-pos" : "amount-neg"} style={{ fontVariantNumeric: "tabular-nums" }}>
                                                {credit ? "+" : "−"} {formatIDR(t.amount)}
                                            </div>
                                            <div className="list-row-meta">
                                                Saldo: {formatIDR(t.balanceAfter)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {totalPages > 1 && (
                                <div className="pager">
                                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                        ← Sebelumnya
                                    </button>
                                    <span className="pager-info">
                                        Halaman {page} dari {totalPages}
                                    </span>
                                    <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                        Berikutnya →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Top-up modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
                    <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleTopup}>
                        <p className="eyebrow">Top-up</p>
                        <h2 className="display" style={{ fontSize: "1.4rem", marginTop: 6 }}>
                            Isi saldo dompet
                        </h2>

                        <div className="field">
                            <label htmlFor="amount">Jumlah (Rp)</label>
                            <input
                                id="amount"
                                className="input"
                                type="number"
                                min={1}
                                step={1}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="cth: 100000"
                                autoFocus
                            />
                        </div>

                        <div className="field-row" style={{ marginTop: 12 }}>
                            {QUICK.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setAmount(String(q))}
                                >
                                    {formatIDR(q)}
                                </button>
                            ))}
                        </div>

                        {formError && <div className="notice notice-danger">{formError}</div>}

                        <div className="field-row" style={{ marginTop: 20 }}>
                            <button type="button" className="btn btn-ghost btn-md" onClick={() => setModalOpen(false)} disabled={submitting}>
                                Batal
                            </button>
                            <button type="submit" className="btn btn-primary btn-md" style={{ flex: 1 }} disabled={submitting}>
                                {submitting ? "Memproses…" : "Isi saldo"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
