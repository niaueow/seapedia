"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Store as StoreIcon, Truck } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../components/toast";
import { Pill, Field, TextInput, cx } from "../../components/primitives";

type RoleName = "BUYER" | "SELLER" | "DRIVER";

const ROLE_TOKEN: Record<string, string> = {
  BUYER: "lime",
  SELLER: "lilac",
  DRIVER: "coral",
};

const SELECTABLE_ROLES: {
  value: RoleName;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    value: "BUYER",
    label: "Pembeli",
    icon: <ShoppingBag size={18} />,
    desc: "Belanja produk lokal, bayar pakai dompet, lacak pesanan.",
  },
  {
    value: "SELLER",
    label: "Penjual",
    icon: <StoreIcon size={18} />,
    desc: "Buka toko sendiri dan jual produkmu ke pembeli sekitar.",
  },
  {
    value: "DRIVER",
    label: "Kurir",
    icon: <Truck size={18} />,
    desc: "Antar pesanan dan dapat penghasilan tambahan.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<RoleName[]>(["BUYER"]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleRole(role: RoleName) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (roles.length === 0) {
      toast.warning("Pilih dulu minimal satu peran ya.");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        auth: false,
        body: { username, email, name: name || undefined, password, roles },
      });
      toast.success("Akunmu jadi! Sekarang tinggal masuk.");
      router.push("/login");
    } catch (e: any) {
      const msg = e?.message ?? "Yah, pendaftarannya belum berhasil. Coba lagi sebentar ya.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 lg:grid-cols-2">
      {/* Left: form */}
      <div>
        <h1 className="t-display-lg mt-3">Yuk, buat akunmu</h1>
        <p className="t-body-lg mt-3 max-w-md text-foreground/65">
          Pilih satu peran atau lebih. Satu akun bisa belanja, jualan, sampai antar pesanan. Kamu yang atur tiap sesi.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 max-w-sm space-y-4">
          <Field label="Nama lengkap">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budi Santoso"
            />
          </Field>
          <Field label="Nama pengguna">
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="budi"
              autoCapitalize="none"
              autoComplete="username"
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="budi@contoh.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Kata sandi">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 t-body-sm text-red-700">
              {error}
            </div>
          )}

          <Pill type="submit" className="w-full" disabled={loading || roles.length === 0}>
            {loading ? "Lagi daftarin kamu…" : "Buat akun"}
          </Pill>
          <p className="t-body-sm text-foreground/50">
            Sudah punya akun?{" "}
            <Link href="/login" className="underline hover:text-foreground">
              Masuk
            </Link>
          </p>
        </form>
      </div>

      {/* Right: role picker */}
      <div>
        <div className="space-y-3">
          {SELECTABLE_ROLES.map((m) => {
            const on = roles.includes(m.value);
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => toggleRole(m.value)}
                className={cx(
                  "flex w-full items-center gap-4 rounded-[16px] border p-5 text-left transition-all",
                  on ? "border-foreground" : "border-[var(--hairline)] hover:border-foreground/40",
                )}
                style={on ? { background: `var(--block-${ROLE_TOKEN[m.value]})`, color: `var(--on-${ROLE_TOKEN[m.value]})` } : undefined}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-white shrink-0">
                  {m.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="t-card-title">{m.label}</div>
                  <div className="t-body-sm text-foreground/65 mt-0.5">{m.desc}</div>
                </div>
                <span
                  className={cx(
                    "grid h-6 w-6 place-items-center rounded-full border shrink-0",
                    on ? "border-black bg-black text-white" : "border-[var(--hairline)]",
                  )}
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 t-caption text-foreground/40">
          Akun Admin tidak bisa didaftarkan sendiri.
        </p>
      </div>
    </div>
  );
}
