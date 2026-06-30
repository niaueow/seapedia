import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ReviewsSection } from "../components/ReviewsSection";

// ── Types ──────────────────────────────────────────────────────────────
type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  store: { id: string; name: string };
};

// ── Utils ──────────────────────────────────────────────────────────────
const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

// ── Data fetching ──────────────────────────────────────────────────────
async function getProducts(): Promise<{
  connected: boolean;
  total: number;
  products: CatalogProduct[];
}> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/catalog/products?limit=8`,
      { cache: "no-store" },
    );
    if (!res.ok) return { connected: false, total: 0, products: [] };
    const json = await res.json();
    return { connected: true, total: json.total ?? 0, products: json.data ?? [] };
  } catch {
    return { connected: false, total: 0, products: [] };
  }
}

// ── Marquee strip ──────────────────────────────────────────────────────
function MarqueeStrip() {
  const words = [
    "PEMBELI",
    "PENJUAL",
    "KURIR",
    "SATU MARKETPLACE",
    "SATU KERANJANG",
    "DOMPET DIGITAL",
    "PPN 12%",
    "MULTI PERAN",
    "TOKO UNIK",
    "DUKUNG UMKM LOKAL",
    "DARI TETANGGA SENDIRI",
  ];
  const strip = [...words, ...words];
  return (
    <div className="overflow-hidden bg-black py-2.5 text-white">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {strip.map((w, i) => (
          <span key={i} className="t-caption text-white/75">
            ★ {w}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Product card (no image — monogram style) ───────────────────────────
function ProductCard({ product }: { product: CatalogProduct }) {
  const monogram = product.name.charAt(0).toUpperCase();
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col text-left"
    >
      <div className="relative overflow-hidden rounded-[8px] bg-[var(--surface-soft)] aspect-square flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span
            className="text-[4rem] font-bold text-foreground/20 transition-transform duration-500 group-hover:scale-105 select-none"
            aria-hidden
          >
            {monogram}
          </span>
        )}
        <div className="absolute left-2 top-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 t-caption bg-[var(--surface-soft)] text-foreground/70"
          >
            {product.store.name}
          </span>
        </div>
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

// ── Home page ──────────────────────────────────────────────────────────
export default async function HomePage() {
  const { connected, total, products } = await getProducts();
  const featured = products.slice(0, 4);
  const hero = products.slice(0, 3);

  return (
    <main>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1280px] px-6 pb-12 pt-16 sm:pt-24">
        <h1 className="t-display-xl max-w-4xl">
          Belanja dari toko lokal di sekitarmu, semudah satu kali klik.
        </h1>
        <p className="t-body-lg mt-6 max-w-2xl text-foreground/70">
          Setiap produk di sini punya cerita dari penjual kecil. Belanja di SEAPEDIA artinya kamu bantu UMKM di sekitarmu tumbuh, tanpa ribet.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
            style={{ fontWeight: 480, letterSpacing: "-0.01em" }}
          >
            Yuk, mulai belanja <ArrowRight size={18} />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] bg-background px-5 py-2.5 text-foreground hover:border-foreground transition-colors"
            style={{ fontWeight: 480, letterSpacing: "-0.01em" }}
          >
            Buka tokomu, gratis
          </Link>
        </div>

        <p className="mt-5 t-body-sm text-foreground/70">
          Belanja di sini, kamu <strong style={{ fontWeight: 600 }}>dukung penjual lokal di sekitarmu</strong>.
        </p>

        {/* Live count */}
        <div className="mt-6 flex items-center gap-2 t-body-sm text-foreground/45">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: connected ? "var(--success)" : "var(--hairline)" }}
          />
          {connected
            ? `${total.toLocaleString("id-ID")} produk siap kamu borong`
            : "Lagi nyambungin ke server, tunggu sebentar ya"}
        </div>

        {/* Hero product grid */}
        {hero.length > 0 && (
          <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-4">
            {hero.map((p, i) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className={`block overflow-hidden rounded-[8px] bg-[var(--surface-soft)] ${i === 1 ? "translate-y-6" : ""}`}
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="aspect-[4/5] flex items-center justify-center">
                    <span className="text-[3rem] font-bold text-foreground/15 select-none">
                      {p.name.charAt(0)}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Marquee ── */}
      <MarqueeStrip />

      {/* ── Featured products ── */}
      <section className="mx-auto max-w-[1280px] px-6 py-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="t-display-lg">Langsung dari penjual lokal</h2>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-1.5 t-body-sm text-foreground/60 hover:text-foreground sm:flex"
          >
            Lihat semua produk <ArrowRight size={16} />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--hairline)] p-12 text-center">
            <p className="t-body text-foreground/50">
              Belum ada produk di sini. Kamu bisa jadi <strong style={{ fontWeight: 600 }}>penjual lokal pertama</strong> di SEAPEDIA.
            </p>
            <Link
              href="/register"
              className="mt-4 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
              style={{ fontWeight: 480 }}
            >
              Buka toko, gratis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── For buyers — lime block ── */}
      <div className="mx-auto max-w-[1280px] px-6">
        <section
          className="w-full rounded-[24px] px-8 py-12 sm:px-12 sm:py-16"
          style={{ background: "var(--block-lime)", color: "var(--on-lime)" }}
        >
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="t-display-lg">Semua belanjamu, satu tempat, banyak toko lokal.</h2>
              <p className="t-body-lg mt-4 max-w-md" style={{ color: "var(--on-lime-soft)" }}>
                Pilih produk, bayar pakai dompet, lacak pesanan. Semua gampang, dan tiap pesananmu bikin toko kecil makin semangat.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  "Isi saldo dompet, gampang",
                  "Satu keranjang buat satu toko, ongkir lebih hemat",
                  "Tiga pilihan pengiriman, tinggal pilih",
                  "Pantau pesananmu dari awal sampai sampai",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 t-body">
                    <Check size={16} /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/products"
                className="mt-7 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
                style={{ fontWeight: 480 }}
              >
                Yuk, mulai belanja <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="overflow-hidden rounded-[8px] bg-white aspect-square flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-foreground/15 select-none">
                      {p.name.charAt(0)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── For sellers — navy block ── */}
      <div className="mx-auto mt-24 max-w-[1280px] px-6">
        <section
          className="w-full rounded-[24px] px-8 py-12 sm:px-12 sm:py-16 text-white"
          style={{ background: "var(--block-navy)" }}
        >
          <h2 className="t-display-lg max-w-2xl text-white">
            Punya usaha? Buka tokomu di sini.
          </h2>
          <p className="t-body-lg mt-4 max-w-xl text-white/75">
            Daftar gratis, atur produkmu sendiri, dan terima pesanan dari pembeli di sekitarmu. Jualan online jadi gampang banget.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Punya nama sendiri", d: "Satu nama unik buat tokomu, tampil ke semua pembeli." },
              { t: "Atur produk", d: "Tambah, ubah, atau hapus produk kapan aja." },
              { t: "Terima pesanan", d: "Pesanan dari pembeli langsung masuk ke tokomu." },
            ].map((c) => (
              <div key={c.t} className="rounded-[16px] bg-white/10 p-5">
                <div className="t-card-title text-white">{c.t}</div>
                <p className="mt-2 t-body-sm text-white/70">{c.d}</p>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-[50px] border border-white/30 bg-transparent px-5 py-2.5 text-white hover:bg-white/10 transition-colors"
            style={{ fontWeight: 480 }}
          >
            Buka tokoku sekarang
          </Link>
        </section>
      </div>

      {/* ── Reviews ── */}
      <ReviewsSection />

      {/* ── Closing CTA ── */}
      <section className="mx-auto max-w-[1280px] px-6 pb-28">
        <div className="rounded-[32px] border border-[var(--hairline)] px-8 py-16 text-center">
          <h2 className="t-display-lg mx-auto max-w-2xl">
            Siap dukung penjual lokal di sekitarmu?
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
              style={{ fontWeight: 480 }}
            >
              Lihat-lihat dulu
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] bg-background px-5 py-2.5 text-foreground hover:border-foreground transition-colors"
              style={{ fontWeight: 480 }}
            >
              Gabung sekarang
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
