"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../auth/auth-context";
import { api } from "../lib/api";
import { ROLE_LABELS, type RoleName } from "../lib/format";
import { ThemeToggle } from "./ThemeToggle";
import { useToast } from "./toast";

type NavLink = { href: string; label: string };

const LINKS_BY_ROLE: Record<RoleName, NavLink[]> = {
    BUYER: [
        { href: "/products", label: "Produk" },
        { href: "/cart", label: "Keranjang" },
        { href: "/orders", label: "Pesanan" },
        { href: "/wallet", label: "Dompet" },
        { href: "/addresses", label: "Alamat" },
    ],
    SELLER: [
        { href: "/products", label: "Katalog" },
        { href: "/seller/store", label: "Toko" },
        { href: "/seller/products", label: "Produk Saya" },
        { href: "/seller/orders", label: "Pesanan Masuk" },
    ],
    DRIVER: [{ href: "/products", label: "Produk" }],
    ADMIN: [{ href: "/products", label: "Produk" }],
};

const GUEST_LINKS: NavLink[] = [
    { href: "/products", label: "Produk" },
    { href: "/#ulasan", label: "Ulasan" },
];

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, logout, selectRole } = useAuth();
    const toast = useToast();
    const [menuOpen, setMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    // Hide the global navbar on the dedicated auth screens.
    const hideOn = pathname === "/login" || pathname === "/register";

    const activeRole = user?.activeRole ?? null;

    // Live cart count for buyers; refetched whenever the cart changes.
    useEffect(() => {
        if (activeRole !== "BUYER") {
            setCartCount(0);
            return;
        }
        let alive = true;
        const load = () =>
            api<{ itemCount: number }>("/cart")
                .then((c) => alive && setCartCount(c.itemCount ?? 0))
                .catch(() => alive && setCartCount(0));
        load();
        const onChange = () => load();
        window.addEventListener("cart:changed", onChange);
        return () => {
            alive = false;
            window.removeEventListener("cart:changed", onChange);
        };
    }, [activeRole]);

    // Close the user menu on outside click.
    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuOpen]);

    if (hideOn) return null;

    const links = activeRole ? LINKS_BY_ROLE[activeRole] : GUEST_LINKS;
    const otherRoles =
        user?.roles.filter((r) => r !== activeRole && r !== "ADMIN") ?? [];

    async function handleSwitchRole(role: RoleName) {
        setMenuOpen(false);
        try {
            await selectRole(role);
            toast.success(`Sekarang bertindak sebagai ${ROLE_LABELS[role]}.`);
            router.push("/dashboard");
        } catch {
            toast.error("Gagal mengganti peran. Coba lagi.");
        }
    }

    async function handleLogout() {
        setMenuOpen(false);
        await logout();
        toast.info("Kamu telah keluar.");
        router.push("/");
    }

    function isActive(href: string) {
        const base = href.split("#")[0];
        if (base === "/products") return pathname.startsWith("/products");
        return base !== "/" && pathname.startsWith(base);
    }

    return (
        <nav className="nav">
            <div className="container nav-inner">
                <Link href="/" className="wordmark" aria-label="SEAPEDIA beranda">
                    <span className="wordmark-sea">SEA</span>
                    <span className="wordmark-pedia">PEDIA</span>
                </Link>

                <div className="nav-links">
                    {links.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`nav-link ${isActive(l.href) ? "is-active" : ""}`}
                        >
                            {activeRole === "BUYER" && l.href === "/cart" ? (
                                <span className="cart-pill">
                                    Keranjang
                                    {cartCount > 0 && (
                                        <span className="cart-count">{cartCount}</span>
                                    )}
                                </span>
                            ) : (
                                l.label
                            )}
                        </Link>
                    ))}
                </div>

                <div className="nav-actions">
                    <ThemeToggle />
                    {loading ? (
                        <span className="spinner" aria-hidden />
                    ) : user ? (
                        <div className="user-cluster" ref={menuRef} style={{ position: "relative" }}>
                            {activeRole && (
                                <span className="role-badge">
                                    {ROLE_LABELS[activeRole]}
                                </span>
                            )}
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                            >
                                {user.username} ▾
                            </button>
                            {menuOpen && (
                                <div className="menu-pop" role="menu">
                                    <Link
                                        href="/dashboard"
                                        className="menu-item"
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Dasbor
                                    </Link>
                                    {otherRoles.length > 0 && (
                                        <>
                                            <div className="menu-label">Ganti peran</div>
                                            {otherRoles.map((r) => (
                                                <button
                                                    key={r}
                                                    className="menu-item"
                                                    role="menuitem"
                                                    onClick={() => handleSwitchRole(r)}
                                                >
                                                    {ROLE_LABELS[r]}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                    <button
                                        className="menu-item menu-item-danger"
                                        role="menuitem"
                                        onClick={handleLogout}
                                    >
                                        Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/products" className="btn btn-ghost btn-sm">
                                Jelajahi produk
                            </Link>
                            <Link href="/login" className="btn btn-primary btn-sm">
                                Masuk
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
