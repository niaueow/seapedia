"use client";

import {
    formatIDR,
    formatDateTime,
    DELIVERY_LABELS,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_CLASS,
} from "../lib/format";

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

export function StatusChip({ status }: { status: string }) {
    return (
        <span className={`status-chip ${ORDER_STATUS_CLASS[status] ?? ""}`}>
            {ORDER_STATUS_LABELS[status] ?? status}
        </span>
    );
}

export function OrderDetail({ order }: { order: OrderFull }) {
    // History newest-first for display.
    const history = [...order.statusHistory].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return (
        <div className="grid-2">
            <div>
                <div className="panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div>
                            <p className="field-label">Nomor pesanan</p>
                            <p className="panel-title" style={{ margin: 0 }}>
                                #{order.id.slice(-8).toUpperCase()}
                            </p>
                            <p className="muted" style={{ fontSize: "0.84rem" }}>
                                {formatDateTime(order.createdAt)}
                                {order.store ? ` · ${order.store.name}` : ""}
                            </p>
                        </div>
                        <StatusChip status={order.status} />
                    </div>
                </div>

                <div className="panel">
                    <p className="panel-title">Produk</p>
                    <div className="table-wrap" style={{ marginTop: 6 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th>Harga</th>
                                    <th>Qty</th>
                                    <th style={{ textAlign: "right" }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((it) => (
                                    <tr key={it.id}>
                                        <td>{it.productName}</td>
                                        <td>{formatIDR(it.unitPrice)}</td>
                                        <td>{it.quantity}</td>
                                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                            {formatIDR(it.lineTotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="panel">
                    <p className="panel-title">Pengiriman</p>
                    <div className="sum-row">
                        <span>Metode</span>
                        <span>{DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}</span>
                    </div>
                    <div className="list-row">
                        <div className="list-row-main">
                            <span className="list-row-title">{order.recipientName}</span>
                            <span className="list-row-meta">{order.recipientPhone}</span>
                            <span className="list-row-meta" style={{ overflowWrap: "anywhere" }}>
                                {order.shippingAddress}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                {/* Money breakdown */}
                <div className="panel">
                    <p className="panel-title">Rincian biaya</p>
                    <div className="sum-row">
                        <span>Subtotal</span>
                        <span>{formatIDR(order.subtotal)}</span>
                    </div>
                    <div className="sum-row">
                        <span>PPN (12%)</span>
                        <span>{formatIDR(order.ppnAmount)}</span>
                    </div>
                    <div className="sum-row">
                        <span>Ongkir</span>
                        <span>{formatIDR(order.deliveryFee)}</span>
                    </div>
                    <div className="sum-row sum-total">
                        <span>Total</span>
                        <span>{formatIDR(order.total)}</span>
                    </div>
                </div>

                {/* Status timeline */}
                <div className="panel">
                    <p className="panel-title">Status pesanan</p>
                    <div className="timeline" style={{ marginTop: 10 }}>
                        {history.map((h) => (
                            <div key={h.id} className="timeline-item">
                                <span className="timeline-dot" />
                                <div className="timeline-body">
                                    <span className="timeline-status">
                                        {ORDER_STATUS_LABELS[h.status] ?? h.status}
                                    </span>
                                    {h.note && (
                                        <span className="timeline-time">{h.note}</span>
                                    )}
                                    <span className="timeline-time">
                                        {formatDateTime(h.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
