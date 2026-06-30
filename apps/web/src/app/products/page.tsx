"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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

function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col text-left">
      <div className="relative overflow-hidden rounded-[8px] bg-[var(--surface-soft)] aspect-square flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="text-[4rem] font-bold text-foreground/20 transition-transform duration-500 group-hover:scale-105 select-none">
            {product.name.charAt(0).toUpperCase()}
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <span className="t-caption">Stok habis</span>
          </div>
        )}
      </div>
      <div className="mt-3 t-caption text-foreground/45">{product.store.name}</div>
      <div className="mt-1 t-card-title leading-snug">{product.name}</div>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span style={{ fontWeight: 560 }}>{formatIDR(product.price)}</span>
        <span className="t-caption text-foreground/45">stok {product.stock}</span>
      </div>
    </Link>
  );
}

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
      .catch(() => alive && setError("Hmm, produknya belum kebuka. Coba muat ulang sebentar ya."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, storeId, page]);

  function pushParams(next: { q?: string; storeId?: string; page?: number }) {
    const qs = new URLSearchParams();
    const nq = next.q ?? q;
    const ns = next.storeId ?? storeId;
    const np = next.page ?? 1;
    if (nq) qs.set("q", nq);
    if (ns) qs.set("storeId", ns);
    if (np > 1) qs.set("page", String(np));
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
    <main className="mx-auto max-w-[1280px] px-6 py-12">
      <h1 className="t-display-lg">Jelajahi toko-toko lokal</h1>
      <p className="t-body-lg mt-3 max-w-xl text-foreground/65">
        Semua produk dari penjual lokal SEAPEDIA. Bebas lihat-lihat, checkout tinggal masuk sebagai Pembeli.
      </p>

      {/* Search + filters */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {storeId && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] px-3 py-1.5 t-body-sm">
              Toko: {storeName ?? "terpilih"}
              <button
                onClick={() => pushParams({ storeId: "", page: 1 })}
                className="text-foreground/50 hover:text-foreground"
                aria-label="Hapus filter toko"
              >
                ✕
              </button>
            </span>
          )}
          {q && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] px-3 py-1.5 t-body-sm">
              "{q}"
              <button
                onClick={() => pushParams({ q: "", page: 1 })}
                className="text-foreground/50 hover:text-foreground"
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        <form onSubmit={onSearch} className="relative sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mau cari apa hari ini?"
            className="w-full rounded-[8px] border border-[var(--hairline)] bg-background py-3 pl-10 pr-4 t-body outline-none transition-colors focus:border-foreground focus:ring-2 focus:ring-foreground/10"
            aria-label="Cari produk"
          />
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="mt-20 flex items-center justify-center gap-3 text-foreground/50">
          <span className="spinner" aria-hidden /> Sebentar, lagi nyiapin produk…
        </div>
      ) : error ? (
        <div className="mt-10 rounded-[16px] bg-red-50 border border-red-200 px-6 py-5 t-body-sm text-red-700">
          {error}
        </div>
      ) : !res || res.data.length === 0 ? (
        <div className="mt-24 text-center">
          <h3 className="t-headline">Belum ketemu nih</h3>
          <p className="mt-2 t-body-lg text-foreground/55">
            {q
              ? `Belum ada yang cocok sama "${q}". Coba kata kunci lain ya.`
              : "Belum ada produk di katalog. Cek lagi nanti ya, penjual lokal baru terus berdatangan."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {res.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-5 py-2.5 t-body-sm hover:border-foreground disabled:opacity-40 transition-colors"
                disabled={page <= 1}
                onClick={() => pushParams({ page: page - 1 })}
              >
                ← Sebelumnya
              </button>
              <span className="t-body-sm text-foreground/50">
                {page} / {totalPages}
              </span>
              <button
                className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-5 py-2.5 t-body-sm hover:border-foreground disabled:opacity-40 transition-colors"
                disabled={page >= totalPages}
                onClick={() => pushParams({ page: page + 1 })}
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-[1280px] px-6 py-12">
          <div className="mt-20 flex items-center justify-center gap-3 text-foreground/50">
            <span className="spinner" aria-hidden /> Sebentar ya…
          </div>
        </main>
      }
    >
      <CatalogInner />
    </Suspense>
  );
}
