"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, Store as StoreIcon, Wallet, MapPin, Package, ChevronRight } from "lucide-react";
import { useAuth } from "../../auth/auth-context";
import { api, ApiError } from "../../lib/api";
import { formatIDR, ROLE_LABELS, type RoleName } from "../../lib/format";
import { Card, ColorBlock, Pill } from "../../components/primitives";

type Store = { id: string; name: string; description: string | null } | null;

const ROLE_BLOCK: Record<RoleName, string> = {
  BUYER: "lime",
  SELLER: "lilac",
  DRIVER: "coral",
  ADMIN: "navy",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-[1280px] px-6 py-12">
          <div className="mt-20 flex items-center justify-center gap-3 text-black/50">
            <span className="spinner" aria-hidden /> Memuat…
          </div>
        </main>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const { user, loading, selectRole } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const denied = params.get("denied");

  const [balance, setBalance] = useState<number | null>(null);
  const [store, setStore] = useState<Store>(null);
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [switching, setSwitching] = useState<RoleName | null>(null);

  const activeRole = user?.activeRole ?? null;

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=%2Fdashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (activeRole !== "BUYER") return;
    api<{ balance: number }>("/wallet")
      .then((w) => setBalance(w.balance))
      .catch(() => setBalance(null));
  }, [activeRole]);

  useEffect(() => {
    if (activeRole !== "SELLER") return;
    api<Store>("/stores/mine")
      .then((s) => setStore(s))
      .catch(() => setStore(null))
      .finally(() => setStoreLoaded(true));
  }, [activeRole]);

  async function handleSwitch(role: RoleName) {
    setSwitching(role);
    try {
      await selectRole(role);
    } catch (e) {
      void (e as ApiError);
    } finally {
      setSwitching(null);
    }
  }

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="mt-20 flex items-center justify-center gap-3 text-black/50">
          <span className="spinner" aria-hidden /> Memuat…
        </div>
      </main>
    );
  }

  const otherRoles = user.roles.filter((r) => r !== activeRole && r !== "ADMIN");

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="t-eyebrow text-black/55 mb-3">
          {activeRole ? ROLE_LABELS[activeRole as RoleName] : "Dasbor"}
        </div>
        <h1 className="t-display-lg">Halo, {user.username}</h1>
        <p className="t-body-lg mt-2 text-black/65">
          Kelola aktivitasmu di Seapedia sesuai peran yang sedang aktif.
        </p>
      </div>

      {denied && (
        <div className="mb-6 rounded-[16px] border border-amber-200 bg-amber-50 px-6 py-4 t-body-sm text-amber-800">
          Halaman itu membutuhkan peran tertentu. Ganti peran aktifmu untuk membukanya.
        </div>
      )}

      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {user.roles.map((r) => {
          const isActive = r === activeRole;
          const color = ROLE_BLOCK[r as RoleName] ?? "cream";
          return (
            <button
              key={r}
              onClick={() => !isActive && handleSwitch(r as RoleName)}
              disabled={isActive || switching !== null}
              className="text-left"
            >
              <div
                className="rounded-[24px] px-6 py-6 transition-all"
                style={{
                  background: `var(--block-${color})`,
                  opacity: switching && switching !== r ? 0.6 : 1,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="t-caption"
                    style={{ color: color === "navy" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}
                  >
                    {isActive ? "Aktif sekarang" : "Ketuk untuk beralih"}
                  </span>
                  {!isActive && <ChevronRight size={16} className="text-black/40" />}
                </div>
                <div
                  className="t-headline"
                  style={{ color: color === "navy" ? "#fff" : "#000" }}
                >
                  {ROLE_LABELS[r as RoleName]}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Role-specific content */}
      {activeRole === "BUYER" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--block-lime)]">
                <Wallet size={18} />
              </div>
              <div className="t-eyebrow text-black/55">Saldo dompet</div>
            </div>
            <div className="t-display-lg">{balance === null ? "Rp0" : formatIDR(balance)}</div>
            <p className="mt-2 t-body-sm text-black/50">Saldo untuk membayar pesanan.</p>
            <div className="mt-5 flex gap-2">
              <Link
                href="/wallet"
                className="inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors t-body-sm"
                style={{ fontWeight: 480 }}
              >
                Isi saldo
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-5 py-2.5 text-black hover:border-black transition-colors t-body-sm"
                style={{ fontWeight: 480 }}
              >
                Riwayat pesanan
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-soft)]">
                <ShoppingBag size={18} />
              </div>
              <div className="t-eyebrow text-black/55">Aksi cepat</div>
            </div>
            <div className="space-y-1">
              {[
                { href: "/products", label: "Jelajahi produk" },
                { href: "/cart", label: "Keranjang belanja" },
                { href: "/addresses", label: "Alamat pengiriman" },
                { href: "/orders", label: "Pesanan saya" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-[10px] px-3 py-2.5 hover:bg-[var(--surface-soft)] transition-colors t-body-sm"
                >
                  {item.label}
                  <ChevronRight size={15} className="text-black/30" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeRole === "SELLER" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--block-lilac)]">
                <StoreIcon size={18} />
              </div>
              <div className="t-eyebrow text-black/55">Tokomu</div>
            </div>
            {!storeLoaded ? (
              <div className="flex items-center gap-3 text-black/50">
                <span className="spinner" aria-hidden /> Memuat…
              </div>
            ) : store ? (
              <>
                <div className="t-headline mt-1">{store.name}</div>
                <p className="mt-1 t-body-sm text-black/55">
                  {store.description || "Belum ada deskripsi toko."}
                </p>
                <div className="mt-5 flex gap-2">
                  <Link
                    href="/seller/products"
                    className="inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors t-body-sm"
                    style={{ fontWeight: 480 }}
                  >
                    Kelola produk
                  </Link>
                  <Link
                    href="/seller/store"
                    className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-5 py-2.5 text-black hover:border-black transition-colors t-body-sm"
                    style={{ fontWeight: 480 }}
                  >
                    Edit toko
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="t-body-sm text-black/55 mt-1">
                  Kamu belum punya toko. Buat toko untuk mulai berjualan.
                </p>
                <Link
                  href="/seller/store"
                  className="mt-4 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors t-body-sm"
                  style={{ fontWeight: 480 }}
                >
                  Buat toko
                </Link>
              </>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-soft)]">
                <Package size={18} />
              </div>
              <div className="t-eyebrow text-black/55">Aksi cepat</div>
            </div>
            <div className="space-y-1">
              {[
                { href: "/seller/store", label: "Profil toko" },
                { href: "/seller/products", label: "Produk saya" },
                { href: "/seller/orders", label: "Pesanan masuk" },
                { href: "/products", label: "Lihat katalog publik" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-[10px] px-3 py-2.5 hover:bg-[var(--surface-soft)] transition-colors t-body-sm"
                >
                  {item.label}
                  <ChevronRight size={15} className="text-black/30" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {(activeRole === "DRIVER" || activeRole === "ADMIN") && (
        <Card className="max-w-lg">
          <div className="t-card-title mb-2">
            {activeRole === "DRIVER" ? "Kurir" : "Admin"}
          </div>
          <p className="t-body-sm text-black/55">
            Fitur untuk peran ini akan hadir pada tahap berikutnya.
            Kamu tetap bisa menjelajahi katalog publik.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-5 py-2.5 text-black hover:border-black transition-colors t-body-sm"
            style={{ fontWeight: 480 }}
          >
            Lihat produk
          </Link>
        </Card>
      )}
    </main>
  );
}
