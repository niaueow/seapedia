"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { api, ApiError } from "../../../lib/api";
import { useRequireRole, GuardGate } from "../../../auth/useRequireRole";
import { OrderDetail, type OrderFull } from "../../../components/OrderDetail";

export default function BuyerOrderDetailPage() {
  const guard = useRequireRole("BUYER");
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guard.ready) return;
    let alive = true;
    setLoading(true);
    setError(null);
    api<OrderFull>(`/orders/${id}`)
      .then((o) => alive && setOrder(o))
      .catch((e: ApiError) => {
        if (!alive) return;
        setError(e.status === 404 || e.status === 403 ? "Pesanan tidak ditemukan." : "Gagal memuat pesanan.");
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [guard.ready, id]);

  if (!guard.ready) return <GuardGate state={guard} />;

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 t-body-sm text-black/50 hover:text-black mb-6 transition-colors"
      >
        <ChevronLeft size={15} /> Kembali ke pesanan
      </Link>

      {loading ? (
        <div className="mt-20 flex items-center justify-center gap-3 text-black/50">
          <span className="spinner" aria-hidden /> Memuat…
        </div>
      ) : error || !order ? (
        <div className="mt-24 text-center">
          <div className="text-5xl mb-5">🚫</div>
          <h3 className="t-headline">{error ?? "Tidak ditemukan"}</h3>
          <p className="mt-2 t-body-lg text-black/55">Pesanan ini tidak tersedia untuk akunmu.</p>
          <Link
            href="/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
            style={{ fontWeight: 480 }}
          >
            Kembali ke pesanan
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="t-eyebrow text-black/55 mb-2">Detail pesanan</div>
            <h1 className="t-display-lg">#{order.id.slice(-8).toUpperCase()}</h1>
          </div>
          <OrderDetail order={order} />
        </>
      )}
    </main>
  );
}
