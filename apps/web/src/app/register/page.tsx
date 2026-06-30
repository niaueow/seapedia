"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Store as StoreIcon, Truck } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../components/toast";
import { Pill, Field, TextInput, cx } from "../../components/primitives";

type RoleName = "BUYER" | "SELLER" | "DRIVER";

const BLOCK_HEX: Record<string, string> = {
  BUYER: "#dceeb1",
  SELLER: "#c5b0f4",
  DRIVER: "#f3c9b6",
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
    desc: "Dompet, keranjang, checkout, riwayat pesanan.",
  },
  {
    value: "SELLER",
    label: "Penjual",
    icon: <StoreIcon size={18} />,
    desc: "Buka toko, kelola produk, proses pesanan.",
  },
  {
    value: "DRIVER",
    label: "Kurir",
    icon: <Truck size={18} />,
    desc: "Temukan pekerjaan, antar pesanan, dan raih penghasilan.",
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
      toast.warning("Pilih minimal satu peran.");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        auth: false,
        body: { username, email, name: name || undefined, password, roles },
      });
      toast.success("Akun berhasil dibuat. Silakan masuk.");
      router.push("/login");
    } catch (e: any) {
      const msg = e?.message ?? "Gagal mendaftar.";
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
        <h1 className="t-display-lg mt-3">Buat akunmu</h1>
        <p className="t-body-lg mt-3 max-w-md text-black/65">
          Pilih satu atau lebih peran. Satu akun bisa membeli, menjual, dan mengirim — kamu yang pilih perannya setiap sesi.
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
            {loading ? "Mendaftar…" : "Buat akun"}
          </Pill>
          <p className="t-body-sm text-black/50">
            Sudah punya akun?{" "}
            <Link href="/login" className="underline hover:text-black">
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
                  on ? "border-black" : "border-[var(--hairline)] hover:border-black/40",
                )}
                style={on ? { background: BLOCK_HEX[m.value] } : undefined}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-white shrink-0">
                  {m.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="t-card-title">{m.label}</div>
                  <div className="t-body-sm text-black/65 mt-0.5">{m.desc}</div>
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
        <p className="mt-3 t-caption text-black/40">
          Akun Admin disediakan melalui data seed, bukan lewat pendaftaran mandiri.
        </p>
      </div>
    </div>
  );
}
