"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { formatIDR, DELIVERY_FEES, DELIVERY_LABELS } from "../../lib/format";
import { useToast } from "../../components/toast";

type Cart = {
    storeId: string | null;
    store: { id: string; name: string } | null;
    items: { id: string; quantity: number; product: { name: string } }[];
    subtotal: number;
    itemCount: number;
};

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

type DeliveryMethod = "INSTANT" | "NEXT_DAY" | "REGULAR";
const METHODS: DeliveryMethod[] = ["INSTANT", "NEXT_DAY", "REGULAR"];

export default function CheckoutPage() {
    const guard = useRequireRole("BUYER");
    const router = useRouter();
    const toast = useToast();

    const [cart, setCart] = useState<Cart | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [addressId, setAddressId] = useState<string>("");
    const [method, setMethod] = useState<DeliveryMethod>("REGULAR");
    const [placing, setPlacing] = useState(false);
    const [placeError, setPlaceError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [c, a, w] = await Promise.all([
                api<Cart>("/cart"),
                api<Address[]>("/addresses"),
                api<{ balance: number }>("/wallet"),
            ]);
            setCart(c);
            setAddresses(a);
            setBalance(w.balance);
            const def = a.find((x) => x.isDefault) ?? a[0];
            if (def) setAddressId(def.id);
        } catch {
            setError("Gagal memuat data checkout.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (guard.ready) load();
    }, [guard.ready]);

    if (!guard.ready) return <GuardGate state={guard} />;

    const subtotal = cart?.subtotal ?? 0;
    const ppn = Math.round(subtotal * 0.12);
    const fee = DELIVERY_FEES[method];
    const total = subtotal + ppn + fee;
    const insufficient = total > balance;
    const empty = !cart || cart.items.length === 0;

    async function placeOrder() {
        setPlaceError(null);
        if (!addressId) {
            setPlaceError("Pilih alamat pengiriman terlebih dahulu.");
            toast.warning("Pilih alamat pengiriman terlebih dahulu.");
            return;
        }
        setPlacing(true);
        try {
            const order = await api<{ id: string }>("/checkout", {
                method: "POST",
                body: { addressId, deliveryMethod: method },
            });
            window.dispatchEvent(new Event("cart:changed"));
            toast.success("Pesanan berhasil dibuat.");
            router.push(`/orders/${order.id}`);
        } catch (e) {
            const err = e as ApiError;
            const code = err.body?.code;
            let msg: string;
            if (code === "INSUFFICIENT_BALANCE") {
                msg = "Saldo tidak cukup. Isi saldo dompet dulu lalu coba lagi.";
            } else if (code === "INSUFFICIENT_STOCK") {
                msg = "Stok salah satu produk tidak mencukupi. Periksa kembali keranjangmu.";
            } else {
                msg = err.message || "Gagal membuat pesanan.";
            }
            setPlaceError(msg);
            toast.error(msg);
            setPlacing(false);
        }
    }

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Selesaikan pesanan</h1>
                        <p className="page-sub">
                            Periksa alamat, pilih pengiriman, lalu bayar dengan saldo dompet.
                        </p>
                    </div>
                </div>

                {error && <div className="notice notice-danger">{error}</div>}

                {loading ? (
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat…
                    </div>
                ) : empty ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🛒</div>
                        <div>
                            <h3 className="empty-state-title">Keranjang kosong</h3>
                            <p className="empty-state-body">
                                Tambahkan produk dulu sebelum checkout.
                            </p>
                        </div>
                        <Link href="/products" className="btn btn-primary btn-sm">
                            Jelajahi produk
                        </Link>
                    </div>
                ) : (
                    <div className="grid-2">
                        {/* Left: address + delivery */}
                        <div>
                            <div className="panel">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <p className="panel-title" style={{ margin: 0 }}>Alamat pengiriman</p>
                                    <Link href="/addresses" className="btn btn-ghost btn-sm">Kelola</Link>
                                </div>
                                {addresses.length === 0 ? (
                                    <div className="notice notice-warn">
                                        Belum ada alamat.{" "}
                                        <Link href="/addresses" style={{ fontWeight: 700, textDecoration: "underline", color: "inherit" }}>
                                            Tambah alamat
                                        </Link>{" "}
                                        untuk melanjutkan.
                                    </div>
                                ) : (
                                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                                        {addresses.map((a) => (
                                            <label
                                                key={a.id}
                                                className="role-choice"
                                                style={{
                                                    marginTop: 0,
                                                    borderColor: addressId === a.id ? "var(--brand)" : undefined,
                                                    background: addressId === a.id ? "var(--violet-50)" : undefined,
                                                    alignItems: "flex-start",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <span style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                    <input
                                                        type="radio"
                                                        name="address"
                                                        checked={addressId === a.id}
                                                        onChange={() => setAddressId(a.id)}
                                                        style={{ marginTop: 4 }}
                                                    />
                                                    <span style={{ fontWeight: 400 }}>
                                                        <span style={{ fontWeight: 700 }}>
                                                            {a.recipientName}
                                                            {a.label ? ` · ${a.label}` : ""}
                                                            {a.isDefault ? " (utama)" : ""}
                                                        </span>
                                                        <br />
                                                        <span className="muted" style={{ fontSize: "0.85rem" }}>
                                                            {a.phone} · {a.fullAddress}
                                                            {a.city ? `, ${a.city}` : ""}
                                                            {a.postalCode ? ` ${a.postalCode}` : ""}
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="panel">
                                <p className="panel-title">Metode pengiriman</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                                    {METHODS.map((m) => (
                                        <label
                                            key={m}
                                            className="role-choice"
                                            style={{
                                                marginTop: 0,
                                                borderColor: method === m ? "var(--brand)" : undefined,
                                                background: method === m ? "var(--violet-50)" : undefined,
                                                cursor: "pointer",
                                            }}
                                        >
                                            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                <input
                                                    type="radio"
                                                    name="delivery"
                                                    checked={method === m}
                                                    onChange={() => setMethod(m)}
                                                />
                                                {DELIVERY_LABELS[m]}
                                            </span>
                                            <span className="price" style={{ fontSize: "0.95rem" }}>
                                                {formatIDR(DELIVERY_FEES[m])}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: summary */}
                        <div className="panel">
                            <p className="panel-title">Ringkasan pesanan</p>
                            <p className="muted" style={{ fontSize: "0.85rem" }}>
                                Toko: {cart!.store?.name} · {cart!.itemCount} item
                            </p>

                            <div style={{ marginTop: 12 }}>
                                <div className="sum-row">
                                    <span>Subtotal</span>
                                    <span>{formatIDR(subtotal)}</span>
                                </div>
                                <div className="sum-row">
                                    <span>PPN (12%)</span>
                                    <span>{formatIDR(ppn)}</span>
                                </div>
                                <div className="sum-row">
                                    <span>Ongkir ({DELIVERY_LABELS[method]})</span>
                                    <span>{formatIDR(fee)}</span>
                                </div>
                                <div className="sum-row sum-total">
                                    <span>Total</span>
                                    <span>{formatIDR(total)}</span>
                                </div>
                            </div>

                            <div className="sum-row" style={{ marginTop: 6 }}>
                                <span>Saldo dompet</span>
                                <span className={insufficient ? "amount-neg" : "amount-pos"}>
                                    {formatIDR(balance)}
                                </span>
                            </div>

                            {insufficient && (
                                <div className="notice notice-warn">
                                    Saldo kurang {formatIDR(total - balance)}.{" "}
                                    <Link href="/wallet" style={{ fontWeight: 700, textDecoration: "underline", color: "inherit" }}>
                                        Isi saldo
                                    </Link>
                                </div>
                            )}

                            {placeError && <div className="notice notice-danger">{placeError}</div>}

                            <button
                                className="btn btn-primary btn-full btn-lg"
                                style={{ marginTop: 16 }}
                                onClick={placeOrder}
                                disabled={placing || insufficient || addresses.length === 0}
                            >
                                {placing ? "Memproses…" : `Bayar ${formatIDR(total)}`}
                            </button>
                            <p className="muted" style={{ fontSize: "0.78rem", marginTop: 10, textAlign: "center" }}>
                                PPN 12% dihitung dari subtotal. Server adalah sumber kebenaran perhitungan.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
