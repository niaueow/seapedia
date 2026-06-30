"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../auth/auth-context";
import { RoleSelectorModal } from "../../auth/RoleSelectorModal";
import { useToast } from "../../components/toast";
import { Pill, Field, TextInput, ColorBlock } from "../../components/primitives";

type RoleName = "ADMIN" | "SELLER" | "BUYER" | "DRIVER";

const DEMO_ACCOUNTS = [
  { user: "buyer", pass: "Buyer#123", note: "Pembeli — dompet, keranjang, checkout" },
  { user: "seller", pass: "Seller#123", note: "Penjual — toko Demo, 2 produk" },
  { user: "multi", pass: "Multi#123", note: "Pembeli + Penjual — bisa ganti peran" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const dest = next && next.startsWith("/") ? next : "/dashboard";
  const { login, selectRole } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsRole, setNeedsRole] = useState(false);
  const [roles, setRoles] = useState<RoleName[]>([]);

  function quickFill(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.requiresRoleSelection) {
        setRoles(result.roles);
        setNeedsRole(true);
      } else {
        router.push(dest);
      }
    } catch (e: any) {
      const msg = e?.message ?? "Username atau kata sandi salah.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChosen(role: RoleName) {
    await selectRole(role);
    setNeedsRole(false);
    router.push(dest);
  }

  return (
    <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 lg:grid-cols-2">
      {/* Left: form */}
      <div>
        <div className="t-eyebrow text-black/60 mb-3">Selamat datang kembali</div>
        <h1 className="t-display-lg mt-3">Masuk ke SEAPEDIA</h1>
        <p className="t-body-lg mt-3 max-w-md text-black/65">
          Satu akun bisa punya beberapa peran. Kamu akan memilih peran aktif setelah masuk.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 max-w-sm space-y-4">
          <Field label="Nama pengguna">
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="buyer"
              autoCapitalize="none"
              autoComplete="username"
            />
          </Field>
          <Field label="Kata sandi">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
            />
          </Field>

          {error && (
            <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 t-body-sm text-red-700">
              {error}
            </div>
          )}

          <Pill type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses…" : "Masuk"}
          </Pill>
          <p className="t-body-sm text-black/50">
            Belum punya akun?{" "}
            <Link href="/register" className="underline hover:text-black">
              Daftar sekarang
            </Link>
          </p>
        </form>
      </div>

      {/* Right: demo accounts */}
      <ColorBlock color="lilac" className="!py-10 !px-10">
        <div className="t-eyebrow text-black/60 mb-2">Akun demo</div>
        <p className="mt-2 t-body text-black/75">Ketuk untuk isi otomatis, lalu masuk.</p>
        <div className="mt-5 space-y-3">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.user}
              onClick={() => quickFill(a.user, a.pass)}
              className="flex w-full items-center justify-between rounded-[12px] bg-white px-4 py-3 text-left hover:ring-2 hover:ring-black/10 transition-all"
            >
              <div>
                <div className="t-body" style={{ fontWeight: 560 }}>
                  {a.user} / {a.pass}
                </div>
                <div className="t-caption text-black/50">{a.note}</div>
              </div>
            </button>
          ))}
        </div>
      </ColorBlock>

      {needsRole && (
        <RoleSelectorModal roles={roles} onSelect={handleRoleChosen} />
      )}
    </div>
  );
}
