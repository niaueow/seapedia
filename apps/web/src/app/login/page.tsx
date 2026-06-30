"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../auth/auth-context";
import { RoleSelectorModal } from "../../auth/RoleSelectorModal";
import { useToast } from "../../components/toast";
import { Pill, Field, TextInput } from "../../components/primitives";

type RoleName = "ADMIN" | "SELLER" | "BUYER" | "DRIVER";

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
      const msg = e?.message ?? "Hmm, username atau sandinya belum pas. Coba cek lagi ya.";
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
    <div className="mx-auto max-w-[720px] px-6 py-16">
      <div>
        <h1 className="t-display-lg">Masuk ke SEAPEDIA</h1>
        <p className="t-body-lg mt-3 max-w-md text-foreground/65">
          Satu akun, banyak peran. Habis masuk, tinggal pilih mau jadi apa.
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
            {loading ? "Sebentar ya…" : "Masuk"}
          </Pill>
          <p className="t-body-sm text-foreground/50">
            Belum punya akun?{" "}
            <Link href="/register" className="underline hover:text-foreground">
              Daftar gratis di sini
            </Link>
          </p>
        </form>
      </div>

      {needsRole && (
        <RoleSelectorModal roles={roles} onSelect={handleRoleChosen} />
      )}
    </div>
  );
}
