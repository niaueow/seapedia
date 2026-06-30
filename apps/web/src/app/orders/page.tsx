"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { formatIDR, formatDateTime, ORDER_STATUS_LABELS, DELIVERY_LABELS } from "../../lib/format";
import { StatusChip } from "../../components/OrderDetail";
import { Card } from "../../components/primitives";

type OrderRow = {
  id: string;
  deliveryMethod: string;
  total: number;
  status: string;
  createdAt: string;
  store: { id: string; name: string };
  _count: { items: number };
};

type OrderList = { data: OrderRow[]; page: number; limit: number; total: number };

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
      .catch(() => alive && setError("Hmm, pesananmu belum kebuka. Coba muat ulang ya."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [guard.ready, page, status]);

  if (!guard.ready) return <GuardGate state={guard} />;

  const totalPages = list ? Math.max(1, Math.ceil(list.total / LIMIT)) : 1;

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="t-display-lg">Pesananmu</h1>
          <p className="t-body-lg mt-2 text-foreground/65">Pantau status dan rincian tiap pesananmu di sini.</p>
        </div>
        <select
          className="rounded-full border border-[var(--hairline)] px-4 py-2 t-body-sm bg-background hover:border-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          aria-label="Filter status"
        >
          <option value="">Semua status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-[16px] bg-red-50 border border-red-200 px-6 py-4 t-body-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-20 flex items-center justify-center gap-3 text-foreground/50">
          <span className="spinner" aria-hidden /> Sebentar ya…
        </div>
      ) : !list || list.data.length === 0 ? (
        <div className="mt-24 text-center">
          <h3 className="t-headline">Belum ada pesanan</h3>
          <p className="mt-2 t-body-lg text-foreground/55">
            {status ? "Belum ada pesanan dengan status ini." : "Pesananmu bakal muncul di sini setelah checkout pertama."}
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
            style={{ fontWeight: 480 }}
          >
            Yuk, mulai belanja
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {list.data.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="block group">
                <Card className="!p-0 overflow-hidden hover:border-foreground/40 transition-colors">
                  <div className="flex items-center justify-between gap-3 px-6 py-5 flex-wrap">
                    <div>
                      <div className="t-body-sm" style={{ fontWeight: 600 }}>
                        #{o.id.slice(-8).toUpperCase()}
                      </div>
                      <div className="t-caption text-foreground/45 mt-0.5">
                        {o.store.name} · {o._count.items} item · {DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}
                      </div>
                      <div className="t-caption text-foreground/35 mt-0.5">{formatDateTime(o.createdAt)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusChip status={o.status} />
                      <div className="t-body-sm" style={{ fontWeight: 580 }}>{formatIDR(o.total)}</div>
                    </div>
                  </div>
                  <div className="border-t border-[var(--hairline-soft)] px-6 py-2.5 flex items-center justify-end gap-1 t-caption text-foreground/40 group-hover:text-foreground transition-colors">
                    Lihat detail <ChevronRight size={13} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-4 py-2 t-body-sm hover:border-foreground disabled:opacity-40 transition-colors"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Sebelumnya
              </button>
              <span className="t-caption text-foreground/40">{page} / {totalPages}</span>
              <button
                className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-4 py-2 t-body-sm hover:border-foreground disabled:opacity-40 transition-colors"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
