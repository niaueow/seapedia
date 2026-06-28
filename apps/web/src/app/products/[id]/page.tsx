"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import { useAuth } from "../../../auth/auth-context";
import { formatIDR } from "../../../lib/format";
import { useToast } from "../../../components/toast";

type ProductDetail = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
    createdAt: string;
    store: { id: string; name: string };
};

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const toast = useToast();

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [qty, setQty] = useState(1);
    const [adding, setAdding] = useState(false);
    const [conflict, setConflict] = useState(false);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setNotFound(false);
        api<ProductDetail>(`/catalog/products/${id}`, { auth: false })
            .then((p) => {
                if (!alive) return;
                setProduct(p);
            })
            .catch((e: ApiError) => {
                if (!alive) return;
                if (e.status === 404) setNotFound(true);
            })
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [id]);

    const isBuyer = user?.activeRole === "BUYER";

    async function doAdd(clearFirst: boolean) {
        if (!product) return;
        setAdding(true);
        try {
            if (clearFirst) await api("/cart", { method: "DELETE" });
            await api("/cart/items", {
                method: "POST",
                body: { productId: product.id, quantity: qty },
            });
            setConflict(false);
            toast.success("Produk ditambahkan ke keranjang.");
            window.dispatchEvent(new Event("cart:changed"));
        } catch (e) {
            const err = e as ApiError;
            if (err.status === 409 && err.body?.code === "DIFFERENT_STORE") {
                setConflict(true);
                toast.warning(
                    "Keranjangmu berisi produk dari toko lain. Satu keranjang hanya untuk satu toko.",
                );
            } else if (err.status === 400) {
                toast.error(err.message || "Jumlah melebihi stok.");
            } else {
                toast.error(err.message || "Gagal menambahkan ke keranjang.");
            }
        } finally {
            setAdding(false);
        }
    }

    function handleAddClick() {
        if (authLoading) return;
        if (!user) {
            router.push(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
            return;
        }
        if (!isBuyer) {
            toast.warning("Beralih ke peran Pembeli untuk menambahkan produk ke keranjang.");
            return;
        }
        doAdd(false);
    }

    if (loading) {
        return (
            <main className="page">
                <div className="container">
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat produk…
                    </div>
                </div>
            </main>
        );
    }

    if (notFound || !product) {
        return (
            <main className="page">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">🚫</div>
                        <div>
                            <h3 className="empty-state-title">Produk tidak ditemukan</h3>
                            <p className="empty-state-body">
                                Produk ini mungkin sudah tidak tersedia atau dihapus penjual.
                            </p>
                        </div>
                        <Link href="/products" className="btn btn-primary btn-sm">
                            Kembali ke katalog
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const out = product.stock <= 0;

    return (
        <main className="page">
            <div className="container">
                <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 14 }}>
                    <Link href="/products" className="nav-link" style={{ padding: 0 }}>
                        ← Kembali ke katalog
                    </Link>
                </p>

                <div className="grid-2">
                    {/* Visual */}
                    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
                        <div
                            className="card-thumb"
                            style={{ height: 320, borderBottom: "1px solid var(--border)" }}
                        >
                            <span className="card-monogram" style={{ fontSize: "6rem" }}>
                                {product.name.charAt(0)}
                            </span>
                            <span className="card-store">{product.store.name}</span>
                        </div>
                        {product.description && (
                            <div style={{ padding: "20px 22px" }}>
                                <p className="panel-title">Deskripsi</p>
                                <p className="muted" style={{ overflowWrap: "anywhere" }}>
                                    {product.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Buy box */}
                    <div>
                        <div className="panel">
                            <h1 className="display" style={{ fontSize: "1.6rem" }}>
                                {product.name}
                            </h1>
                            <div className="price" style={{ fontSize: "1.8rem", marginTop: 10 }}>
                                {formatIDR(product.price)}
                            </div>
                            <p
                                className={out ? "" : "muted"}
                                style={{
                                    marginTop: 6,
                                    fontSize: "0.9rem",
                                    color: out ? "var(--danger)" : undefined,
                                    fontWeight: out ? 600 : undefined,
                                }}
                            >
                                {out ? "Stok habis" : `Stok tersedia: ${product.stock}`}
                            </p>

                            {!out && (
                                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
                                    <span className="muted" style={{ fontSize: "0.9rem" }}>Jumlah</span>
                                    <div className="stepper">
                                        <button
                                            type="button"
                                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                                            disabled={qty <= 1}
                                            aria-label="Kurangi"
                                        >
                                            −
                                        </button>
                                        <span className="stepper-value">{qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                                            disabled={qty >= product.stock}
                                            aria-label="Tambah"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                className="btn btn-primary btn-full btn-lg"
                                onClick={handleAddClick}
                                disabled={out || adding || authLoading}
                            >
                                {adding ? "Menambahkan…" : out ? "Stok habis" : "Tambah ke keranjang"}
                            </button>

                            {!user && !authLoading && (
                                <p className="muted" style={{ fontSize: "0.84rem", marginTop: 10, textAlign: "center" }}>
                                    <Link href="/login" style={{ color: "var(--brand-dark)", fontWeight: 600 }}>
                                        Masuk
                                    </Link>{" "}
                                    sebagai pembeli untuk berbelanja.
                                </p>
                            )}

                            {conflict && (
                                <div className="notice notice-warn" style={{ marginBottom: 0 }}>
                                    Keranjangmu masih berisi produk dari toko lain.
                                    <button
                                        className="btn btn-outline btn-full"
                                        style={{ marginTop: 12 }}
                                        onClick={() => doAdd(true)}
                                        disabled={adding}
                                    >
                                        Kosongkan keranjang &amp; tambah ini
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Store block */}
                        <div className="panel">
                            <p className="field-label">Dijual oleh</p>
                            <div className="display" style={{ fontSize: "1.15rem", marginTop: 4 }}>
                                {product.store.name}
                            </div>
                            <Link
                                href={`/products?storeId=${product.store.id}`}
                                className="btn btn-outline btn-sm"
                                style={{ marginTop: 14 }}
                            >
                                Lihat semua produk toko ini
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
