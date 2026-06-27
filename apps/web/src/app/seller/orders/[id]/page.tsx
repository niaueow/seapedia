"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "../../../../lib/api";
import { useRequireRole, GuardGate } from "../../../../auth/useRequireRole";
import { OrderDetail, type OrderFull } from "../../../../components/OrderDetail";

export default function SellerOrderDetailPage() {
    const guard = useRequireRole("SELLER");
    const { id } = useParams<{ id: string }>();

    const [order, setOrder] = useState<OrderFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!guard.ready) return;
        let alive = true;
        setLoading(true);
        setError(null);
        api<OrderFull>(`/seller/orders/${id}`)
            .then((o) => alive && setOrder(o))
            .catch((e: ApiError) => {
                if (!alive) return;
                setError(
                    e.status === 404 || e.status === 403
                        ? "Pesanan tidak ditemukan."
                        : "Gagal memuat pesanan.",
                );
            })
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [guard.ready, id]);

    if (!guard.ready) return <GuardGate state={guard} />;

    return (
        <main className="page">
            <div className="container">
                <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 14 }}>
                    <Link href="/seller/orders" className="nav-link" style={{ padding: 0 }}>
                        ← Kembali ke pesanan masuk
                    </Link>
                </p>

                {loading ? (
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat…
                    </div>
                ) : error || !order ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🚫</div>
                        <div>
                            <h3 className="empty-state-title">{error ?? "Tidak ditemukan"}</h3>
                            <p className="empty-state-body">
                                Pesanan ini bukan milik tokomu atau tidak tersedia.
                            </p>
                        </div>
                        <Link href="/seller/orders" className="btn btn-primary btn-sm">
                            Kembali
                        </Link>
                    </div>
                ) : (
                    <>
                        <OrderDetail order={order} />
                        <p className="muted" style={{ fontSize: "0.82rem", marginTop: 16, textAlign: "center" }}>
                            Pemrosesan pesanan oleh penjual tersedia pada tahap berikutnya.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}
