"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { api } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { formatIDR, DELIVERY_FEES, DELIVERY_LABELS } from "../../lib/format";
import { useToast } from "../../components/toast";
import { Pill, Card, ColorBlock, cx } from "../../components/primitives";

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

type DeliveryMethod = "INSTANT" | "NEXT_DAY" | "REGULAR";

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; fee: number }[] = [
  { value: "INSTANT", label: "Instan", fee: 30000 },
  { value: "NEXT_DAY", label: "Hari Berikutnya", fee: 20000 },
  { value: "REGULAR", label: "Reguler", fee: 10000 },
];

export default function CartPage() {
  const guard = useRequireRole("BUYER");
  const router = useRouter();
  const toast = useToast();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [method, setMethod] = useState<DeliveryMethod>("NEXT_DAY");

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

  useEffect(() => { if (guard.ready) load(); }, [guard.ready]);

  if (!guard.ready) return <GuardGate state={guard} />;

  function notifyChange() {
    window.dispatchEvent(new Event("cart:changed"));
  }

  async function changeQty(item: CartItem, nextQty: number) {
    setBusyId(item.id);
    try {
      const updated = await api<Cart>(`/cart/items/${item.id}`, {
        method: "PATCH",
        body: { quantity: nextQty },
      });
      setCart(updated);
      notifyChange();
    } catch (e: any) {
      toast.error(e?.message || "Gagal memperbarui jumlah.");
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
      toast.success("Item dihapus.");
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

  const subtotal = cart?.subtotal ?? 0;
  const fee = DELIVERY_FEES[method];
  const ppn = Math.round(subtotal * 0.12);
  const total = subtotal + ppn + fee;
  const empty = !cart || cart.items.length === 0;

  if (loading) {
    return (
      <main className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="mt-20 flex items-center justify-center gap-3 text-black/50">
          <span className="spinner" aria-hidden /> Memuat…
        </div>
      </main>
    );
  }

  if (empty) {
    return (
      <main className="mx-auto max-w-[700px] px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--surface-soft)]">
          <ShoppingBag size={24} />
        </div>
        <h1 className="t-display-lg mt-5">Keranjangmu kosong</h1>
        <p className="mt-3 t-body-lg text-black/65">
          Satu keranjang hanya bisa berisi produk dari satu toko.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
          style={{ fontWeight: 480 }}
        >
          Jelajahi marketplace
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-12">
      <h1 className="t-display-lg">Keranjangmu</h1>
      {cart!.store && (
        <p className="mt-2 t-body-lg text-black/65">
          Dari <span style={{ fontWeight: 560 }}>{cart!.store.name}</span> · satu toko, satu keranjang
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-[16px] bg-red-50 border border-red-200 px-6 py-4 t-body-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="t-body-sm text-black/50">{cart!.itemCount} item</span>
            <button
              className="t-body-sm text-red-600 hover:text-red-800 transition-colors"
              onClick={clearCart}
              disabled={busyId !== null}
            >
              Kosongkan
            </button>
          </div>

          {cart!.items.map((item) => (
            <Card key={item.id} className="!p-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[8px] bg-[var(--surface-soft)] flex items-center justify-center">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-black/20 select-none">
                      {item.product.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.product.id}`} className="t-card-title truncate hover:underline block">
                    {item.product.name}
                  </Link>
                  <div className="t-body-sm text-black/50 mt-0.5">
                    {formatIDR(item.product.price)} per item
                  </div>
                </div>
                <div className="flex items-center rounded-full border border-[var(--hairline)]">
                  <button
                    onClick={() => changeQty(item, item.quantity - 1)}
                    disabled={busyId !== null || item.quantity <= 1}
                    className="grid h-9 w-9 place-items-center hover:bg-[var(--surface-soft)] rounded-full transition-colors disabled:opacity-40"
                    aria-label="Kurangi"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-7 text-center t-body-sm">{item.quantity}</span>
                  <button
                    onClick={() => changeQty(item, Math.min(item.product.stock, item.quantity + 1))}
                    disabled={busyId !== null || item.quantity >= item.product.stock}
                    className="grid h-9 w-9 place-items-center hover:bg-[var(--surface-soft)] rounded-full transition-colors disabled:opacity-40"
                    aria-label="Tambah"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <div className="w-28 text-right" style={{ fontWeight: 560 }}>
                  {formatIDR(item.lineTotal)}
                </div>
                <button
                  onClick={() => removeItem(item)}
                  disabled={busyId !== null}
                  className="grid h-9 w-9 place-items-center text-black/40 hover:text-black transition-colors disabled:opacity-40"
                  aria-label="Hapus item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}

          {/* Delivery method */}
          <Card>
            <div className="grid gap-3 sm:grid-cols-3">
              {DELIVERY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMethod(opt.value)}
                  className={cx(
                    "rounded-[12px] border p-4 text-left transition-all",
                    method === opt.value
                      ? "border-black bg-[var(--surface-soft)]"
                      : "border-[var(--hairline)] hover:border-black/40",
                  )}
                >
                  <div className="t-card-title">{opt.label}</div>
                  <div className="mt-1 t-body-sm">{formatIDR(opt.fee)}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ColorBlock color="lime" className="!py-7 !px-7">
            <div className="space-y-2.5 t-body">
              <div className="flex items-center justify-between text-black/75">
                <span>Subtotal ({cart!.itemCount} item)</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-black/75">
                <span>Ongkir ({DELIVERY_LABELS[method]})</span>
                <span>{formatIDR(fee)}</span>
              </div>
              <div className="flex items-center justify-between text-black/75">
                <span>PPN 12%</span>
                <span>{formatIDR(ppn)}</span>
              </div>
              <div
                className="flex items-center justify-between border-t border-black/10 pt-3"
                style={{ fontWeight: 620 }}
              >
                <span>Total</span>
                <span>{formatIDR(total)}</span>
              </div>
            </div>

            <Pill
              className="mt-5 w-full"
              onClick={() => router.push("/checkout")}
              disabled={busyId !== null}
            >
              Lanjut ke checkout · {formatIDR(total)}
            </Pill>
            <Link
              href="/products"
              className="mt-2 flex items-center justify-center w-full rounded-[50px] border border-black/20 px-5 py-2.5 t-body-sm hover:border-black transition-colors"
              style={{ fontWeight: 480 }}
            >
              Lanjut belanja
            </Link>
          </ColorBlock>
        </div>
      </div>
    </main>
  );
}
