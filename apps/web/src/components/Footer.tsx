"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
    const pathname = usePathname();
    if (pathname === "/login" || pathname === "/register") return null;

    return (
        <footer className="site-footer">
            <div className="container site-footer-inner">
                <div>
                    &copy; {new Date().getFullYear()} Seapedia — marketplace banyak
                    toko. Belanja dengan tenang.
                </div>
                <div className="footer-links">
                    <Link href="/products" className="footer-link">
                        Produk
                    </Link>
                    <Link href="/#ulasan" className="footer-link">
                        Ulasan
                    </Link>
                    <Link href="/dashboard" className="footer-link">
                        Dasbor
                    </Link>
                </div>
            </div>
        </footer>
    );
}
