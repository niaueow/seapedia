import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[700px] px-6 py-28 text-center">
      <div className="t-display-xl text-foreground/15 select-none leading-none">404</div>
      <h1 className="t-headline mt-4">Halaman ini nggak ketemu</h1>
      <p className="mt-3 t-body-lg text-foreground/55">
        Mungkin link-nya salah atau halamannya sudah pindah. Yuk, balik belanja dari penjual lokal.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
        style={{ fontWeight: 480 }}
      >
        Kembali ke beranda
      </Link>
    </main>
  );
}
