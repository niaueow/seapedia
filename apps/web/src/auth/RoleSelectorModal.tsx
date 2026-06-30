"use client";

import { useState } from "react";

type RoleName = "ADMIN" | "SELLER" | "BUYER" | "DRIVER";

const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Admin",
  SELLER: "Penjual",
  BUYER: "Pembeli",
  DRIVER: "Kurir",
};

const ROLE_BG: Record<RoleName, string> = {
  BUYER: "var(--block-lime)",
  SELLER: "var(--block-lilac)",
  DRIVER: "var(--block-coral)",
  ADMIN: "var(--block-navy)",
};

export function RoleSelectorModal({
  roles,
  onSelect,
}: {
  roles: RoleName[];
  onSelect: (role: RoleName) => Promise<void>;
}) {
  const [busy, setBusy] = useState<RoleName | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: RoleName) {
    setError(null);
    setBusy(role);
    try {
      await onSelect(role);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memilih peran.");
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-6">
        <div className="t-eyebrow text-black/55 mb-2">Multi-peran</div>
        <h2 className="t-headline mb-2">Masuk sebagai</h2>
        <p className="t-body-sm text-black/55 mb-5">
          Akunmu punya lebih dari satu peran. Pilih peran yang ingin kamu gunakan sekarang.
        </p>

        <div className="space-y-2">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => choose(role)}
              disabled={busy !== null}
              className="flex w-full items-center justify-between rounded-[14px] px-5 py-4 text-left transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: ROLE_BG[role] ?? "var(--surface-soft)" }}
            >
              <span className="t-body-sm" style={{ fontWeight: 560, color: role === "ADMIN" ? "#fff" : "#000" }}>
                {ROLE_LABELS[role]}
              </span>
              <span
                aria-hidden
                className="t-body-sm"
                style={{ color: role === "ADMIN" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)" }}
              >
                {busy === role ? "…" : "→"}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 t-body-sm text-red-700">{error}</div>
        )}
      </div>
    </div>
  );
}
