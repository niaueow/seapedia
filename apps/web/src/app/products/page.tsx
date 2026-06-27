"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { formatIDR } from "../../lib/format";

type CatalogProduct = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
    store: { id: string; name: string };
};

type CatalogResponse = {
    data: CatalogProduct[];
    page: number;
    limit: number;
    total: number;
};

const LIMIT = 12;

function CatalogInner() {
    const router = useRouter();
    const params = useSearchParams();

    const q = params.get("q") ?? "";
    const storeId = params.get("storeId") ?? "";
    const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

    const [search, setSearch] = useState(q);
    const [res, setRes] = useState<CatalogResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Keep the input in sync if the URL query changes externally.
    useEffect(() => setSearch(q), [q]);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);
        const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        if (q) qs.set("q", q);
        if (storeId) qs.set("storeId", storeId);
        api<CatalogResponse>(`/catalog/products?${qs.toString()}`, { auth: false })
            .then((r) => alive && setRes(r))
            .catch(() => alive && setError("Gagal memuat produk. Pastikan server berjalan."))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [q, storeId, page]);

    function pushParams(next: { q?: string; storeId?: string; page?: number }) {
        const qs = new URLSearchParams();
        const nq = next.q ?? q;
        const nStore = next.storeId ?? storeId;
        const nPage = next.page ?? 1;
        if (nq) qs.set("q", nq);
        if (nStore) qs.set("storeId", nStore);
        if (nPage > 1) qs.set("page", String(nPage));
        router.push(`/products${qs.toString() ? `?${qs.toString()}` : ""}`);
    }

    function onSearch(e: React.FormEvent) {
        e.preventDefault();
        pushParams({ q: search.trim(), page: 1 });
    }

    const total = res?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));
    const storeName = storeId ? res?.data[0]?.store.name : null;

    return (
        <main className="page">
            <div className="container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Katalog</p>
                        <h1 className="page-title">Jelajahi produk</h1>
                        <p className="page-sub">
                            Produk dari berbagai toko di Seapedia. Satu keranjang hanya bisa
                            berisi produk dari satu toko.
                        </p>
                    </div>
                </div>

                <form className="search-bar" onSubmit={onSearch}>
                    <input
                        className="input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari produk…"
                        aria-label="Cari produk"
                    />
                    <button className="btn btn-primary btn-md" type="submit">
                        Cari
                    </button>
                    {q && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-md"
                            onClick={() => pushParams({ q: "", page: 1 })}
                        >
                            Reset
                        </button>
                    )}
                </form>

                {/* Active filters */}
                {(storeId || q) && (
                    <div className="toolbar">
                        {storeId && (
                            <span className="chip">
                                Toko: {storeName ?? "terpilih"}
                                <button
                                    type="button"
                                    aria-label="Hapus filter toko"
                                    onClick={() => pushParams({ storeId: "", page: 1 })}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 800 }}
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {q && <span className="chip">Pencarian: “{q}”</span>}
                    </div>
                )}

                {loading ? (
                    <div className="loading-row">
                        <span className="spinner" aria-hidden /> Memuat produk…
                    </div>
                ) : error ? (
                    <div className="notice notice-danger">{error}</div>
                ) : !res || res.data.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <div>
                            <h3 className="empty-state-title">Produk tidak ditemukan</h3>
                            <p className="empty-state-body">
                                {q
                                    ? `Tidak ada produk yang cocok dengan “${q}”. Coba kata kunci lain.`
                                    : "Belum ada produk di katalog. Coba lagi nanti."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="product-grid">
                            {res.data.map((p) => (
                                <Link href={`/products/${p.id}`} key={p.id} className="card">
                                    <div className="card-thumb">
                                        <span className="card-monogram">{p.name.charAt(0)}</span>
                                        <span className="card-store">{p.store.name}</span>
                                    </div>
                                    <div className="card-body">
                                        <h3 className="card-name">{p.name}</h3>
                                        <div className="card-price">{formatIDR(p.price)}</div>
                                        <div className={`card-stock ${p.stock > 0 ? "" : "out"}`}>
                                            {p.stock > 0 ? `Stok tersedia: ${p.stock}` : "Stok habis"}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="pager">
                                <button
                                    className="btn btn-outline btn-sm"
                                    disabled={page <= 1}
                                    onClick={() => pushParams({ page: page - 1 })}
                                >
                                    ← Sebelumnya
                                </button>
                                <span className="pager-info">
                                    Halaman {page} dari {totalPages}
                                </span>
                                <button
                                    className="btn btn-outline btn-sm"
                                    disabled={page >= totalPages}
                                    onClick={() => pushParams({ page: page + 1 })}
                                >
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

export default function ProductsPage() {
    return (
        <Suspense
            fallback={
                <main className="page">
                    <div className="container">
                        <div className="loading-row">
                            <span className="spinner" aria-hidden /> Memuat…
                        </div>
                    </div>
                </main>
            }
        >
            <CatalogInner />
        </Suspense>
    );
}
