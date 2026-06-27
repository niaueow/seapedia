"use client";

import { useState } from "react";

type RoleName = "ADMIN" | "SELLER" | "BUYER" | "DRIVER";

const ROLE_LABELS: Record<RoleName, string> = {
    ADMIN: "Admin",
    SELLER: "Penjual",
    BUYER: "Pembeli",
    DRIVER: "Kurir",
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
        <div className="modal-overlay">
            <div className="modal-card">
                <p className="eyebrow">Pilih peran</p>
                <h2 className="display" style={{ fontSize: "1.5rem", marginTop: 8 }}>
                    Masuk sebagai
                </h2>
                <p className="muted" style={{ marginTop: 8, fontSize: "0.92rem" }}>
                    Akunmu punya lebih dari satu peran. Pilih peran yang ingin kamu
                    gunakan sekarang.
                </p>

                {roles.map((role) => (
                    <button
                        key={role}
                        className="role-choice"
                        onClick={() => choose(role)}
                        disabled={busy !== null}
                    >
                        <span>{ROLE_LABELS[role]}</span>
                        <span aria-hidden>{busy === role ? "…" : "→"}</span>
                    </button>
                ))}

                {error && <div className="form-error">{error}</div>}
            </div>
        </div>
    );
}