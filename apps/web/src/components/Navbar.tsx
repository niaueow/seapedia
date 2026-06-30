"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../auth/auth-context";
import { api } from "../lib/api";
import { type RoleName } from "../lib/format";
import { useToast } from "./toast";
import {
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  Wallet,
  LogOut,
  Store as StoreIcon,
  Truck,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

type NavLink = { href: string; label: string };

const LINKS_BY_ROLE: Record<RoleName, NavLink[]> = {
  BUYER: [
    { href: "/products", label: "Marketplace" },
    { href: "/orders", label: "Pesanan" },
    { href: "/wallet", label: "Dompet" },
    { href: "/addresses", label: "Alamat" },
  ],
  SELLER: [
    { href: "/products", label: "Marketplace" },
    { href: "/seller/store", label: "Toko" },
    { href: "/seller/products", label: "Produk Saya" },
    { href: "/seller/orders", label: "Pesanan Masuk" },
  ],
  DRIVER: [{ href: "/products", label: "Marketplace" }],
  ADMIN: [{ href: "/products", label: "Marketplace" }],
};

const GUEST_LINKS: NavLink[] = [
  { href: "/products", label: "Marketplace" },
];

const ROLE_ICON: Record<RoleName, React.ReactNode> = {
  BUYER: <ShoppingBag size={14} />,
  SELLER: <StoreIcon size={14} />,
  DRIVER: <Truck size={14} />,
  ADMIN: <ShieldCheck size={14} />,
};

const ROLE_LABELS: Record<RoleName, string> = {
  BUYER: "Pembeli",
  SELLER: "Penjual",
  DRIVER: "Kurir",
  ADMIN: "Admin",
};

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, selectRole } = useAuth();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const hideOn = pathname === "/login" || pathname === "/register";
  const activeRole = user?.activeRole ?? null;

  useEffect(() => {
    if (activeRole !== "BUYER") { setCartCount(0); return; }
    let alive = true;
    const load = () =>
      api<{ itemCount: number }>("/cart")
        .then((c) => alive && setCartCount(c.itemCount ?? 0))
        .catch(() => alive && setCartCount(0));
    load();
    const onChange = () => load();
    window.addEventListener("cart:changed", onChange);
    return () => { alive = false; window.removeEventListener("cart:changed", onChange); };
  }, [activeRole]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setRoleMenu(false);
    }
    if (roleMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [roleMenu]);

  if (hideOn) return null;

  const links = activeRole ? LINKS_BY_ROLE[activeRole] : GUEST_LINKS;
  const otherRoles = user?.roles.filter((r) => r !== activeRole && r !== "ADMIN") ?? [];

  function isActive(href: string) {
    const base = href.split("#")[0];
    if (base === "/products") return pathname.startsWith("/products");
    return base !== "/" && pathname.startsWith(base);
  }

  async function handleSwitchRole(role: RoleName) {
    setRoleMenu(false);
    setMobileOpen(false);
    try {
      await selectRole(role);
      toast.success(`Siap, sekarang kamu jadi ${ROLE_LABELS[role]}.`);
      router.push("/dashboard");
    } catch {
      toast.error("Yah, perannya belum bisa diganti. Coba lagi ya.");
    }
  }

  async function handleLogout() {
    setRoleMenu(false);
    setMobileOpen(false);
    await logout();
    toast.info("Kamu sudah keluar. Sampai ketemu lagi!");
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--hairline)] bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-6 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="grid h-6 w-6 place-items-center rounded-md bg-black text-white"
            style={{ fontWeight: 700, fontSize: 13 }}
          >
            S
          </span>
          <span style={{ fontWeight: 620, letterSpacing: "-0.02em", fontSize: 18 }}>
            SEAPEDIA
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="ml-2 hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "t-body-sm transition-colors hover:text-foreground",
                isActive(l.href) ? "text-foreground" : "text-foreground/55",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {loading ? (
            <span className="spinner" aria-hidden />
          ) : !user ? (
            <>
              <Link
                href="/login"
                className="t-body-sm px-2 text-foreground/70 hover:text-foreground"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white t-body-sm hover:bg-neutral-800 transition-colors"
                style={{ fontWeight: 480 }}
              >
                Daftar gratis
              </Link>
            </>
          ) : (
            <>
              {activeRole === "BUYER" && (
                <Link
                  href="/cart"
                  className="relative grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-soft)] hover:bg-[var(--hairline)] transition-colors"
                  aria-label="Keranjang"
                >
                  <ShoppingBag size={18} />
                  {cartCount > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-white"
                      style={{ background: "var(--accent-magenta)", fontSize: 10, fontWeight: 600 }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Role dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setRoleMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-[var(--hairline)] py-1.5 pl-3 pr-2 hover:border-foreground transition-colors"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--surface-soft)] text-foreground">
                    {activeRole ? ROLE_ICON[activeRole] : <UserIcon size={13} />}
                  </span>
                  <span className="t-body-sm">{user.username}</span>
                  <ChevronDown size={14} className="text-foreground/40" />
                </button>

                {roleMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-[16px] border border-[var(--hairline)] bg-background p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                    <div className="px-3 pb-1.5 pt-1 t-caption text-foreground/45">
                      {activeRole ? ROLE_LABELS[activeRole] : "Pilih peran"}
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left hover:bg-[var(--surface-soft)] t-body-sm"
                      onClick={() => setRoleMenu(false)}
                    >
                      Dasbor
                    </Link>

                    {otherRoles.length > 0 && (
                      <>
                        <div className="my-1 h-px bg-[var(--hairline-soft)]" />
                        <div className="px-3 pb-1 t-caption text-foreground/40">Ganti peran</div>
                        {otherRoles.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleSwitchRole(r as RoleName)}
                            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left hover:bg-[var(--surface-soft)] t-body-sm"
                          >
                            <span className="text-foreground/50">
                              {ROLE_ICON[r as RoleName]}
                            </span>
                            {ROLE_LABELS[r as RoleName]}
                          </button>
                        ))}
                      </>
                    )}

                    <div className="my-1.5 h-px bg-[var(--hairline-soft)]" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left hover:bg-[var(--surface-soft)] t-body-sm text-foreground/70"
                    >
                      <LogOut size={14} /> Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--surface-soft)] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-[var(--hairline)] bg-background px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "t-body-sm transition-colors hover:text-foreground",
                  isActive(l.href) ? "text-foreground font-medium" : "text-foreground/60",
                )}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}

            <div className="h-px bg-[var(--hairline)]" />

            {loading ? null : !user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-[50px] border border-[var(--hairline)] bg-background px-5 py-2.5 t-body-sm hover:border-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white t-body-sm hover:bg-neutral-800"
                  onClick={() => setMobileOpen(false)}
                >
                  Daftar gratis
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="t-caption text-foreground/45">Lagi masuk sebagai {user.username}</div>
                {activeRole === "BUYER" && (
                  <Link
                    href="/cart"
                    className="flex items-center gap-2 t-body-sm text-foreground/70"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ShoppingBag size={15} /> Keranjang {cartCount > 0 ? `(${cartCount})` : ""}
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 t-body-sm text-foreground/70"
                  onClick={() => setMobileOpen(false)}
                >
                  Dasbor
                </Link>
                {otherRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleSwitchRole(r as RoleName)}
                    className="flex items-center gap-2 rounded-[10px] text-left t-body-sm text-foreground/70"
                  >
                    {ROLE_ICON[r as RoleName]} Beralih ke {ROLE_LABELS[r as RoleName]}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-left t-body-sm text-foreground/60"
                >
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-[var(--hairline-soft)]">
              <span className="t-caption text-foreground/40">Tampilan</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
