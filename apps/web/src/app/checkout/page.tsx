"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { formatIDR, DELIVERY_FEES, DELIVERY_LABELS } from "../../lib/format";
import { useToast } from "../../components/toast";
import { Card, ColorBlock, Pill, cx } from "../../components/primitives";

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

  useEffect(() => { if (guard.ready) load(); }, [guard.ready]);

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
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <h1 className="t-display-lg">Selesaikan pesanan</h1>
      <p className="t-body-lg mt-2 text-foreground/65">
        Periksa alamat, pilih pengiriman, lalu bayar dengan saldo dompet.
      </p>

      {error && (
        <div className="mt-4 rounded-[16px] bg-red-50 border border-red-200 px-6 py-4 t-body-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-20 flex items-center justify-center gap-3 text-foreground/50">
          <span className="spinner" aria-hidden /> Memuat…
        </div>
      ) : empty ? (
        <div className="mt-24 text-center">
          <h3 className="t-headline">Keranjang kosong</h3>
          <p className="mt-2 t-body-lg text-foreground/55">Tambahkan produk dulu sebelum checkout.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
            style={{ fontWeight: 480 }}
          >
            Jelajahi produk
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Left: address + delivery */}
          <div className="space-y-5">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-soft)]">
                    <MapPin size={18} />
                  </div>
                </div>
                <Link href="/addresses" className="t-body-sm text-foreground/50 hover:text-foreground">
                  Kelola
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-[12px] bg-amber-50 border border-amber-200 px-4 py-3 t-body-sm text-amber-800">
                  Belum ada alamat.{" "}
                  <Link href="/addresses" className="font-bold underline">
                    Tambah alamat
                  </Link>{" "}
                  untuk melanjutkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={cx(
                        "flex items-start gap-3 rounded-[12px] border p-4 cursor-pointer transition-all",
                        addressId === a.id
                          ? "border-black bg-[var(--surface-soft)]"
                          : "border-[var(--hairline)] hover:border-foreground/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={addressId === a.id}
                        onChange={() => setAddressId(a.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="t-body-sm" style={{ fontWeight: 560 }}>
                          {a.recipientName}{a.label ? ` · ${a.label}` : ""}{a.isDefault ? " (utama)" : ""}
                        </div>
                        <div className="t-caption text-foreground/50 mt-0.5">
                          {a.phone} · {a.fullAddress}{a.city ? `, ${a.city}` : ""}{a.postalCode ? ` ${a.postalCode}` : ""}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="space-y-3">
                {METHODS.map((m) => (
                  <label
                    key={m}
                    className={cx(
                      "flex items-center justify-between rounded-[12px] border p-4 cursor-pointer transition-all",
                      method === m
                        ? "border-black bg-[var(--surface-soft)]"
                        : "border-[var(--hairline)] hover:border-foreground/40",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={method === m}
                        onChange={() => setMethod(m)}
                      />
                      <span className="t-body-sm" style={{ fontWeight: method === m ? 560 : 330 }}>
                        {DELIVERY_LABELS[m]}
                      </span>
                    </div>
                    <span className="t-body-sm" style={{ fontWeight: 560 }}>
                      {formatIDR(DELIVERY_FEES[m])}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: summary */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ColorBlock color="lime" className="!py-7 !px-7">
              <p className="t-body-sm text-foreground/60 mb-4">
                Toko: {cart!.store?.name} · {cart!.itemCount} item
              </p>

              <div className="space-y-2.5 t-body">
                <div className="flex justify-between text-foreground/75">
                  <span>Subtotal</span>
                  <span>{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-foreground/75">
                  <span>PPN (12%)</span>
                  <span>{formatIDR(ppn)}</span>
                </div>
                <div className="flex justify-between text-foreground/75">
                  <span>Ongkir ({DELIVERY_LABELS[method]})</span>
                  <span>{formatIDR(fee)}</span>
                </div>
                <div
                  className="flex justify-between border-t border-black/10 pt-3"
                  style={{ fontWeight: 620 }}
                >
                  <span>Total</span>
                  <span>{formatIDR(total)}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between rounded-[10px] bg-background/60 px-3 py-2 t-body-sm">
                <span className="text-foreground/60">Saldo dompet</span>
                <span
                  style={{ fontWeight: 560, color: insufficient ? "var(--danger)" : "var(--success)" }}
                >
                  {formatIDR(balance)}
                </span>
              </div>

              {insufficient && (
                <div className="mt-3 rounded-[10px] bg-background/60 px-3 py-2.5 t-body-sm text-foreground/70">
                  Saldo kurang {formatIDR(total - balance)}.{" "}
                  <Link href="/wallet" className="font-bold underline">
                    Isi saldo
                  </Link>
                </div>
              )}

              {placeError && (
                <div className="mt-3 rounded-[10px] bg-red-50 border border-red-200 px-3 py-2.5 t-body-sm text-red-700">
                  {placeError}
                </div>
              )}

              <Pill
                className="mt-5 w-full"
                onClick={placeOrder}
                disabled={placing || insufficient || addresses.length === 0}
              >
                {placing ? "Memproses…" : `Bayar ${formatIDR(total)}`}
              </Pill>
              <p className="mt-3 t-caption text-foreground/45 text-center">
                PPN 12% dihitung dari subtotal saja, bukan ongkir.
              </p>
            </ColorBlock>
          </div>
        </div>
      )}
    </main>
  );
}
