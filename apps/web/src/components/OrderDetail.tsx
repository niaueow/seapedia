"use client";

import { formatIDR, formatDateTime, DELIVERY_LABELS, ORDER_STATUS_LABELS } from "../lib/format";
import { Card, ColorBlock } from "./primitives";

export type OrderItem = {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderStatusEntry = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
};

export type OrderFull = {
  id: string;
  deliveryMethod: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  subtotal: number;
  deliveryFee: number;
  ppnAmount: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusEntry[];
  store?: { id: string; name: string };
};

const STATUS_BG: Record<string, string> = {
  SEDANG_DIKEMAS: "var(--block-lime)",
  SEDANG_DIKIRIM: "var(--block-lilac)",
  SELESAI: "var(--block-mint)",
  DIBATALKAN: "var(--block-pink)",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 t-caption"
      style={{ background: STATUS_BG[status] ?? "var(--surface-soft)", fontWeight: 540 }}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function OrderDetail({ order }: { order: OrderFull }) {
  const history = [...order.statusHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Left column */}
      <div className="space-y-5">
        {/* Header */}
        <Card>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="t-eyebrow text-black/55 mb-1">Nomor pesanan</div>
              <div className="t-headline">#{order.id.slice(-8).toUpperCase()}</div>
              <div className="t-caption text-black/40 mt-1">
                {formatDateTime(order.createdAt)}{order.store ? ` · ${order.store.name}` : ""}
              </div>
            </div>
            <StatusChip status={order.status} />
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="t-eyebrow text-black/55 mb-4">Produk yang dipesan</div>
          <div className="divide-y divide-[var(--hairline-soft)]">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="t-body-sm" style={{ fontWeight: 540 }}>{it.productName}</div>
                  <div className="t-caption text-black/45 mt-0.5">
                    {formatIDR(it.unitPrice)} × {it.quantity}
                  </div>
                </div>
                <div className="t-body-sm" style={{ fontWeight: 560 }}>
                  {formatIDR(it.lineTotal)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Shipping */}
        <Card>
          <div className="t-eyebrow text-black/55 mb-4">Pengiriman</div>
          <div className="flex justify-between t-body-sm mb-3">
            <span className="text-black/55">Metode</span>
            <span style={{ fontWeight: 540 }}>{DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}</span>
          </div>
          <div className="rounded-[12px] bg-[var(--surface-soft)] p-4">
            <div className="t-body-sm" style={{ fontWeight: 560 }}>{order.recipientName}</div>
            <div className="t-caption text-black/50 mt-0.5">{order.recipientPhone}</div>
            <div className="t-caption text-black/50 mt-1" style={{ overflowWrap: "anywhere" }}>
              {order.shippingAddress}
            </div>
          </div>
        </Card>
      </div>

      {/* Right column */}
      <div className="space-y-5">
        {/* Cost breakdown */}
        <ColorBlock color="lime" className="!py-7 !px-7">
          <div className="t-eyebrow text-black/60 mb-4">Rincian biaya</div>
          <div className="space-y-2.5 t-body">
            <div className="flex justify-between text-black/75">
              <span>Subtotal</span>
              <span>{formatIDR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-black/75">
              <span>PPN (12%)</span>
              <span>{formatIDR(order.ppnAmount)}</span>
            </div>
            <div className="flex justify-between text-black/75">
              <span>Ongkir</span>
              <span>{formatIDR(order.deliveryFee)}</span>
            </div>
            <div
              className="flex justify-between border-t border-black/10 pt-3"
              style={{ fontWeight: 620 }}
            >
              <span>Total</span>
              <span>{formatIDR(order.total)}</span>
            </div>
          </div>
        </ColorBlock>

        {/* Status timeline */}
        <Card>
          <div className="t-eyebrow text-black/55 mb-4">Status pesanan</div>
          <div className="space-y-0">
            {history.map((h, i) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2"
                    style={{
                      borderColor: i === 0 ? "#000" : "var(--hairline)",
                      background: i === 0 ? "#000" : "transparent",
                    }}
                  />
                  {i < history.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--hairline)]" style={{ minHeight: 20 }} />
                  )}
                </div>
                <div className="pb-4">
                  <div className="t-body-sm" style={{ fontWeight: i === 0 ? 560 : 440 }}>
                    {ORDER_STATUS_LABELS[h.status] ?? h.status}
                  </div>
                  {h.note && <div className="t-caption text-black/50">{h.note}</div>}
                  <div className="t-caption text-black/40">{formatDateTime(h.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
