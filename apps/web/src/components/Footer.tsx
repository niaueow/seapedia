"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const cols = [
  {
    head: "Marketplace",
    links: [
      { label: "Semua produk", href: "/products" },
      { label: "Masuk", href: "/login" },
      { label: "Daftar", href: "/register" },
    ],
  },
  {
    head: "Penjual",
    links: [
      { label: "Buka toko", href: "/register" },
      { label: "Kelola produk", href: "/seller/products" },
      { label: "Pesanan masuk", href: "/seller/orders" },
    ],
  },
  {
    head: "Pembeli",
    links: [
      { label: "Keranjang", href: "/cart" },
      { label: "Dompet", href: "/wallet" },
      { label: "Alamat", href: "/addresses" },
      { label: "Pesanan saya", href: "/orders" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <footer className="border-t border-[var(--hairline)] bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div style={{ fontWeight: 620, fontSize: 28, letterSpacing: "-0.03em" }}>
              SEAPEDIA
            </div>
            <p className="mt-3 max-w-xs t-body-sm text-black/55">
              Marketplace banyak toko untuk pembeli, penjual, dan kurir. Dibangun dengan satu akun, banyak peran.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.head}>
              <div className="t-caption mb-3 text-black/45">{c.head}</div>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="t-body-sm text-black/65 hover:text-black transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--hairline-soft)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="t-caption text-black/40">
            &copy; {new Date().getFullYear()} SEAPEDIA
          </span>
          <span className="t-caption text-black/40">
            Hitam-putih dengan warna blok pastel
          </span>
        </div>
      </div>
    </footer>
  );
}
