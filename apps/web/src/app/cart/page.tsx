"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { formatIDR } from "../../lib/format";
import { useToast } from "../../components/toast";

type CartItem = {
    id: string;
    quantity: number;
    lineTotal: number;
    product: {
        id: string;
        name: string;
        price: number;
        stock: number;
        imageUrl: string | null;
        storeId: string;
    };
};

type Cart = {
    storeId: string | null;
    store: { id: string; name: string } | null;
    items: CartItem[];
    subtotal: number;
    itemCount: number;
};

export default function CartPage() {
    const guard = useRequireRole("BUYER");
    const router = useRouter();
    const toast = useToast();

    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            setCart(await api<Cart>("/cart"));
        } catch {
            setError("Gagal memuat keranjang.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (guard.ready) load();
    }, [guard.ready]);

    if (!guard.ready) return <GuardGate state={guard} />;

    function notifyChange() {
        window.dispatchEvent(new Event("cart:changed"));
    }

    async function changeQty(item: CartItem, nextQty: number) {
        setBusyId(item.id);
        setError(null);
        try {
            const updated = await api<Cart>(`/cart/items/${item.id}`, {
                method: "PATCH",
                body: { quantity: nextQty },
            });
            setCart(updated);
            notifyChange();
        } catch (e: any) {
            const msg = e?.message || "Gagal memperbarui jumlah.";
            setError(msg);
            toast.error(msg);
        } finally {
            setBusyId(null);
        }
    }

    async function removeItem(item: CartItem) {
        setBusyId(item.id);
        try {
            const updated = await api<Cart>(`/cart/items/${item.id}`, { method: "DELETE" });
            setCart(updated);
            notifyChange();
            toast.success("Item dihapus dari keranjang.");
        } catch {
            toast.error("Gagal menghapus item.");
        } finally {
            setBusyId(null);
        }
    }

    async function clearCart() {
        if (!confirm("Kosongkan seluruh keranjang?")) return;
        setBusyId("__all__");
        try {
            const updated = await api<Cart>("/cart", { method: "DELETE" });
            setCart(updated);
            notifyChange();
            toast.success("Keranjang dikosongkan.");
        } catch {
            toast.error("Gagal mengosongkan keranjang.");
        } finally {
            setBusyId(null);
        }
    }

    const empty = !cart || cart.items.length === 0;

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Keranjang belanja</h1>
                        <p className="page-sub">
                            Satu keranjang hanya berisi produk dari satu toko.
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
                            <h3 className="empty-state-title">Keranjangmu kosong</h3>
                            <p className="empty-state-body">
                                Tambahkan produk dari katalog untuk mulai berbelanja.
                            </p>
                        </div>
                        <Link href="/products" className="btn btn-primary btn-sm">
                            Jelajahi produk
                        </Link>
                    </div>
                ) : (
                    <div className="grid-2">
                        <div className="panel">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <p className="panel-title" style={{ margin: 0 }}>
                                    Toko: {cart!.store?.name}
                                </p>
                                <button className="btn btn-ghost btn-sm" onClick={clearCart} disabled={busyId !== null} style={{ color: "var(--danger)" }}>
                                    Kosongkan
                                </button>
                            </div>

                            {cart!.items.map((item) => (
                                <div key={item.id} className="list-row">
                                    <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                                        <div className="card-thumb" style={{ width: 56, height: 56, borderRadius: "var(--r-sm)", flexShrink: 0, borderBottom: "none" }}>
                                            <span className="card-monogram" style={{ fontSize: "1.4rem" }}>
                                                {item.product.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="list-row-main">
                                            <Link href={`/products/${item.product.id}`} className="list-row-title">
                                                {item.product.name}
                                            </Link>
                                            <span className="list-row-meta">
                                                {formatIDR(item.product.price)} · stok {item.product.stock}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                        <div className="stepper">
                                            <button
                                                type="button"
                                                aria-label="Kurangi"
                                                disabled={busyId !== null || item.quantity <= 1}
                                                onClick={() => changeQty(item, item.quantity - 1)}
                                            >
                                                −
                                            </button>
                                            <span className="stepper-value">{item.quantity}</span>
                                            <button
                                                type="button"
                                                aria-label="Tambah"
                                                disabled={busyId !== null || item.quantity >= item.product.stock}
                                                onClick={() => changeQty(item, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="price" style={{ fontSize: "0.95rem" }}>
                                            {formatIDR(item.lineTotal)}
                                        </span>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: "var(--danger)", height: 28, paddingInline: 8 }}
                                            onClick={() => removeItem(item)}
                                            disabled={busyId !== null}
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="panel">
                            <p className="panel-title">Ringkasan</p>
                            <div className="sum-row">
                                <span>Subtotal ({cart!.itemCount} item)</span>
                                <span>{formatIDR(cart!.subtotal)}</span>
                            </div>
                            <p className="muted" style={{ fontSize: "0.82rem", marginTop: 6 }}>
                                Ongkir dan PPN 12% dihitung saat checkout.
                            </p>
                            <button
                                className="btn btn-primary btn-full btn-lg"
                                style={{ marginTop: 16 }}
                                onClick={() => router.push("/checkout")}
                                disabled={busyId !== null}
                            >
                                Lanjut ke checkout
                            </button>
                            <Link href="/products" className="btn btn-ghost btn-full" style={{ marginTop: 8 }}>
                                Lanjut belanja
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
