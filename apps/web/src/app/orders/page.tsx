"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import {
    formatIDR,
    formatDateTime,
    ORDER_STATUS_LABELS,
    DELIVERY_LABELS,
} from "../../lib/format";
import { StatusChip } from "../../components/OrderDetail";

type OrderRow = {
    id: string;
    deliveryMethod: string;
    total: number;
    status: string;
    createdAt: string;
    store: { id: string; name: string };
    _count: { items: number };
};

type OrderList = {
    data: OrderRow[];
    page: number;
    limit: number;
    total: number;
};

const LIMIT = 8;
const STATUSES = Object.keys(ORDER_STATUS_LABELS);

export default function OrdersPage() {
    const guard = useRequireRole("BUYER");

    const [list, setList] = useState<OrderList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (!guard.ready) return;
        let alive = true;
        setLoading(true);
        setError(null);
        const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        if (status) qs.set("status", status);
        api<OrderList>(`/orders?${qs.toString()}`)
            .then((r) => alive && setList(r))
            .catch(() => alive && setError("Gagal memuat pesanan."))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [guard.ready, page, status]);

    if (!guard.ready) return <GuardGate state={guard} />;

    const totalPages = list ? Math.max(1, Math.ceil(list.total / LIMIT)) : 1;

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Riwayat pesanan</h1>
                        <p className="page-sub">Lacak status dan rincian pesananmu.</p>
                    </div>
                </div>

                <div className="toolbar">
                    <select
                        className="select"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        aria-label="Filter status"
                    >
                        <option value="">Semua status</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {ORDER_STATUS_LABELS[s]}
                            </option>
                        ))}
                    </select>
                </div>

                {error && <div className="notice notice-danger">{error}</div>}

                {loading ? (
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat…
                    </div>
                ) : !list || list.data.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <div>
                            <h3 className="empty-state-title">Belum ada pesanan</h3>
                            <p className="empty-state-body">
                                {status
                                    ? "Tidak ada pesanan dengan status ini."
                                    : "Pesananmu akan muncul di sini setelah checkout."}
                            </p>
                        </div>
                        <Link href="/products" className="btn btn-primary btn-sm">
                            Mulai belanja
                        </Link>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {list.data.map((o) => (
                                <Link
                                    key={o.id}
                                    href={`/orders/${o.id}`}
                                    className="panel"
                                    style={{ marginTop: 0, display: "block" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                                        <div>
                                            <span className="list-row-title">
                                                #{o.id.slice(-8).toUpperCase()}
                                            </span>
                                            <div className="list-row-meta">
                                                {o.store.name} · {o._count.items} item ·{" "}
                                                {DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}
                                            </div>
                                            <div className="list-row-meta">
                                                {formatDateTime(o.createdAt)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                                            <StatusChip status={o.status} />
                                            <span className="price">{formatIDR(o.total)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

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
        </main>
    );
}
