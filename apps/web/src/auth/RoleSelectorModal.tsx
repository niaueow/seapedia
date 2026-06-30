"use client";

import { useState } from "react";

type RoleName = "ADMIN" | "SELLER" | "BUYER" | "DRIVER";

const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: "Admin",
  SELLER: "Penjual",
  BUYER: "Pembeli",
  DRIVER: "Kurir",
};

const ROLE_TOKEN: Record<RoleName, string> = {
  BUYER: "lime",
  SELLER: "lilac",
  DRIVER: "coral",
  ADMIN: "navy",
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
      setError(e?.message ?? "Yah, perannya belum bisa dipilih. Coba lagi ya.");
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-[24px] bg-background p-6">
        <h2 className="t-headline mb-2">Mau masuk sebagai apa?</h2>
        <p className="t-body-sm text-foreground/55 mb-5">
          Akunmu punya beberapa peran. Pilih satu buat sekarang, bisa diganti kapan aja.
        </p>

        <div className="space-y-2">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => choose(role)}
              disabled={busy !== null}
              className="flex w-full items-center justify-between rounded-[14px] px-5 py-4 text-left transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: `var(--block-${ROLE_TOKEN[role]})` }}
            >
              <span className="t-body-sm" style={{ fontWeight: 560, color: `var(--on-${ROLE_TOKEN[role]})` }}>
                {ROLE_LABELS[role]}
              </span>
              <span
                aria-hidden
                className="t-body-sm"
                style={{ color: `var(--on-${ROLE_TOKEN[role]}-soft)` }}
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
