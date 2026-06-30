"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus, Store as StoreIcon } from "lucide-react";
import { api, ApiError } from "../../../lib/api";
import { useAuth } from "../../../auth/auth-context";
import { formatIDR } from "../../../lib/format";
import { useToast } from "../../../components/toast";
import { Card, Pill } from "../../../components/primitives";

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
      .then((p) => { if (!alive) return; setProduct(p); })
      .catch((e: ApiError) => { if (!alive) return; if (e.status === 404) setNotFound(true); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  const isBuyer = user?.activeRole === "BUYER";

  async function doAdd(clearFirst: boolean) {
    if (!product) return;
    setAdding(true);
    try {
      if (clearFirst) await api("/cart", { method: "DELETE" });
      await api("/cart/items", { method: "POST", body: { productId: product.id, quantity: qty } });
      setConflict(false);
      toast.success("Produk ditambahkan ke keranjang.");
      window.dispatchEvent(new Event("cart:changed"));
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409 && err.body?.code === "DIFFERENT_STORE") {
        setConflict(true);
        toast.warning("Keranjangmu berisi produk dari toko lain.");
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
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/products/${id}`)}`); return; }
    if (!isBuyer) { toast.warning("Beralih ke peran Pembeli untuk menambahkan ke keranjang."); return; }
    doAdd(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="mt-20 flex items-center justify-center gap-3 text-black/50">
          <span className="spinner" aria-hidden /> Memuat produk…
        </div>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="mx-auto max-w-[700px] px-6 py-24 text-center">
        <h3 className="t-headline">Produk tidak ditemukan</h3>
        <p className="mt-2 t-body-lg text-black/55">Produk ini mungkin sudah tidak tersedia atau dihapus penjual.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
          style={{ fontWeight: 480 }}
        >
          Kembali ke katalog
        </Link>
      </main>
    );
  }

  const out = product.stock <= 0;

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 t-body-sm text-black/50 hover:text-black mb-6 transition-colors"
      >
        <ChevronLeft size={15} /> Kembali ke katalog
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Visual */}
        <div className="rounded-[24px] border border-[var(--hairline)] overflow-hidden">
          <div className="relative flex items-center justify-center bg-[var(--surface-soft)]" style={{ height: 340 }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-9xl font-black text-black/10 select-none leading-none">
                {product.name.charAt(0)}
              </span>
            )}
            <div className="absolute bottom-4 left-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 t-caption text-white backdrop-blur-sm">
                <StoreIcon size={11} /> {product.store.name}
              </span>
            </div>
          </div>
          {product.description && (
            <div className="p-6 border-t border-[var(--hairline-soft)]">
              <p className="t-body text-black/70" style={{ overflowWrap: "anywhere" }}>
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="space-y-4">
          <Card>
            <h1 className="t-display-lg">{product.name}</h1>
            <div className="mt-3 t-display-lg" style={{ color: "var(--foreground)" }}>
              {formatIDR(product.price)}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: out ? "var(--danger)" : "var(--success)" }}
              />
              <span
                className="t-body-sm"
                style={{ color: out ? "var(--danger)" : "var(--success)", fontWeight: 540 }}
              >
                {out ? "Stok habis" : `Stok tersedia: ${product.stock}`}
              </span>
            </div>

            {!out && (
              <div className="mt-5 flex items-center gap-4">
                <span className="t-body-sm text-black/55">Jumlah</span>
                <div className="flex items-center rounded-full border border-[var(--hairline)]">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="grid h-9 w-9 place-items-center hover:bg-[var(--surface-soft)] rounded-full transition-colors disabled:opacity-40"
                    aria-label="Kurangi"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center t-body-sm">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="grid h-9 w-9 place-items-center hover:bg-[var(--surface-soft)] rounded-full transition-colors disabled:opacity-40"
                    aria-label="Tambah"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            <Pill
              className="mt-5 w-full"
              onClick={handleAddClick}
              disabled={out || adding || authLoading}
            >
              {adding ? "Menambahkan…" : out ? "Stok habis" : "Tambah ke keranjang"}
            </Pill>

            {!user && !authLoading && (
              <p className="mt-3 t-caption text-black/45 text-center">
                <Link href="/login" className="underline hover:text-black">Masuk</Link> sebagai pembeli untuk berbelanja.
              </p>
            )}
          </Card>

          {conflict && (
            <Card>
              <div className="t-body-sm text-black/70 mb-3">
                Keranjangmu masih berisi produk dari toko lain. Satu keranjang hanya bisa berisi produk dari satu toko.
              </div>
              <button
                className="w-full rounded-[50px] border border-black px-5 py-2.5 t-body-sm hover:bg-black hover:text-white transition-colors disabled:opacity-40"
                style={{ fontWeight: 480 }}
                onClick={() => doAdd(true)}
                disabled={adding}
              >
                Kosongkan keranjang dan tambah ini
              </button>
            </Card>
          )}

          {/* Store card */}
          <Card>
            <div className="t-headline">{product.store.name}</div>
            <Link
              href={`/products?storeId=${product.store.id}`}
              className="mt-4 inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-4 py-2 t-body-sm hover:border-black transition-colors"
            >
              Lihat semua produk toko ini
            </Link>
          </Card>
        </div>
      </div>
    </main>
  );
}
