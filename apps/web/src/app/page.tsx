import Link from "next/link";

// ── Static Assets (Hoisted SVG icons for better rendering performance & no flickering) ──
const StoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
  </svg>
);

const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5.45 7.49" />
    <path d="M23 9h-4a2 2 0 0 0-0 4h4v-4Z" />
    <path d="M5 11v4" />
  </svg>
);

const FastDeliveryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
    <path d="M3 8h4m-4 4h4" />
  </svg>
);

// ── Types ──
type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  store: { id: string; name: string };
};

// ── Utils ──
const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

// ── Data Fetching (Server Component) ──
async function getProducts(): Promise<{
  connected: boolean;
  total: number;
  products: CatalogProduct[];
}> {
  try {
    // async-api-routes: fetch starts, await late
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/catalog/products?limit=8`,
      { cache: "no-store", next: { revalidate: 0 } }
    );
    if (!res.ok) return { connected: false, total: 0, products: [] };
    const json = await res.json();
    return {
      connected: true,
      total: json.total ?? 0,
      products: json.data ?? [],
    };
  } catch {
    return { connected: false, total: 0, products: [] };
  }
}

// ── Static Features Array (Hoisted) ──
const FEATURES = [
  { icon: <StoreIcon />, label: "Banyak toko lokal" },
  { icon: <WalletIcon />, label: "Bayar pakai dompet digital" },
  { icon: <FastDeliveryIcon />, label: "Pengiriman cepat" },
];

export default async function HomePage() {
  const { connected, total, products } = await getProducts();

  return (
    <main>
      {/* ── Navigation ── */}
      <nav className="nav">
        <div className="container nav-inner">
          <div className="wordmark">
            <span className="wordmark-sea">SEA</span>
            <span className="wordmark-pedia">PEDIA</span>
          </div>
          <div className="nav-actions">
            <Link href="/products" className="btn btn-ghost btn-sm">
              Jelajahi produk
            </Link>
            <Link href="/login" className="btn btn-primary btn-sm">
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="container hero">
        <h1 className="hero-title">
          Belanja dari banyak toko lokal, <em>semua dalam satu tempat.</em>
        </h1>

        <p className="hero-body">
          Temukan produk dari penjual yang bisa kamu percaya. Isi saldo dompet,
          lalu selesaikan pesanan dalam hitungan detik.
        </p>

        <div className="hero-actions">
          <Link href="/products" className="btn btn-primary btn-lg">
            Mulai belanja
          </Link>
          <Link href="/register" className="btn btn-outline btn-lg">
            Buka toko sendiri
          </Link>
        </div>

        {/* Live signal — quiet trust line instead of a system-status chip */}
        <div className={`trust-line ${connected ? "" : "offline"}`}>
          <span className="trust-dot" />
          {connected
            ? `${total.toLocaleString("id-ID")} produk siap kamu jelajahi`
            : "Belum tersambung ke server. Pastikan API sedang berjalan."}
        </div>

        {/* Feature Pills */}
        <div className="feature-row">
          {FEATURES.map((feat, idx) => (
            <div key={idx} className="feature-pill">
              <span className="feature-pill-icon">{feat.icon}</span>
              {feat.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Products Grid ── */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Produk pilihan untukmu</h2>
          <p className="section-desc">
            Barang populer dari berbagai toko, siap dikirim ke tempatmu.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛍️</div>
            <div>
              <h3 className="empty-state-title">Belum ada produk di sini</h3>
              <p className="empty-state-body">
                Toko-toko baru sedang bersiap. Kamu juga bisa jadi yang pertama
                berjualan di Seapedia.
              </p>
            </div>
            <Link href="/register" className="btn btn-primary btn-sm" style={{ marginTop: 4 }}>
              Buka toko
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <Link href={`/products/${p.id}`} key={p.id} className="card">
                <div className="card-thumb">
                  <span className="card-monogram">{p.name.charAt(0)}</span>
                  <span className="card-store">{p.store.name}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-name">{p.name}</h3>
                  <div className="card-price">{formatIDR(p.price)}</div>
                  <div className={`card-stock ${p.stock > 0 ? "" : "out"}`}>
                    {p.stock > 0 ? `Stok tersedia: ${p.stock}` : "Stok habis"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Closing CTA ── */}
      <section className="container">
        <div className="cta-band">
          <h2 className="cta-title">Punya sesuatu untuk dijual?</h2>
          <p className="cta-body">
            Buka toko tanpa biaya, atur etalasemu, dan mulai terima pesanan hari ini.
          </p>
          <div className="cta-actions">
            <Link href="/register" className="btn btn-on-brand btn-lg">
              Buka toko sekarang
            </Link>
            <Link href="/products" className="btn btn-on-brand-outline btn-lg">
              Lihat semua produk
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="container footer">
        <div>&copy; {new Date().getFullYear()} Seapedia. Belanja dengan tenang.</div>
        <div className="footer-links">
          <Link href="/terms" className="footer-link">Syarat &amp; Ketentuan</Link>
          <Link href="/privacy" className="footer-link">Privasi</Link>
        </div>
      </footer>
    </main>
  );
}
