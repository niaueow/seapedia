"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { formatIDR, formatDateTime, WALLET_TXN_LABELS } from "../../lib/format";
import { useToast } from "../../components/toast";
import { Card, ColorBlock, Pill, Field, TextInput } from "../../components/primitives";

type Txn = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

type History = { data: Txn[]; page: number; limit: number; total: number };

const LIMIT = 8;
const QUICK = [50_000, 100_000, 500_000, 1_000_000];

export default function WalletPage() {
  const guard = useRequireRole("BUYER");
  const toast = useToast();

  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, h] = await Promise.all([
        api<{ balance: number }>("/wallet"),
        api<History>(`/wallet/history?page=${page}&limit=${LIMIT}`),
      ]);
      setBalance(w.balance);
      setHistory(h);
    } catch {
      setError("Gagal memuat dompet.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { if (guard.ready) loadAll(); }, [guard.ready, loadAll]);

  if (!guard.ready) return <GuardGate state={guard} />;

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault();
    const val = Math.floor(Number(amount));
    if (!Number.isFinite(val) || val < 1) {
      toast.error("Masukkan jumlah yang valid (minimal Rp 1).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ balance: number }>("/wallet/topup", {
        method: "POST",
        body: { amount: val },
      });
      setBalance(res.balance);
      setAmount("");
      setPage(1);
      toast.success(`Saldo bertambah ${formatIDR(val)}.`);
      await loadAll();
    } catch (e) {
      const msg = (e as ApiError).message || "Gagal mengisi saldo.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = history ? Math.max(1, Math.ceil(history.total / LIMIT)) : 1;

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="t-eyebrow text-black/55 mb-3">Keuangan</div>
      <h1 className="t-display-lg">Dompet saya</h1>
      <p className="t-body-lg mt-2 text-black/65">
        Isi saldo untuk membayar pesanan. Top-up bersifat simulasi.
      </p>

      {error && (
        <div className="mt-4 rounded-[16px] bg-red-50 border border-red-200 px-6 py-4 t-body-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Left: balance + top-up */}
        <div className="space-y-5">
          {/* Balance block */}
          <ColorBlock color="lime" className="!py-8 !px-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-black/10">
                <Wallet size={18} />
              </div>
              <div className="t-eyebrow text-black/60">Saldo aktif</div>
            </div>
            <div className="t-display-lg">
              {balance === null ? "Rp0" : formatIDR(balance)}
            </div>
          </ColorBlock>

          {/* Quick top-up */}
          <Card>
            <div className="t-eyebrow text-black/55 mb-4">Isi saldo</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className="rounded-full border border-[var(--hairline)] py-2.5 t-body-sm hover:border-black transition-colors"
                >
                  + {formatIDR(q)}
                </button>
              ))}
            </div>
            <form onSubmit={handleTopup} className="flex gap-2">
              <TextInput
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Jumlah lainnya…"
              />
              <Pill type="submit" disabled={submitting} className="shrink-0">
                <Plus size={16} />
              </Pill>
            </form>
          </Card>
        </div>

        {/* Right: history */}
        <Card className="h-fit">
          <div className="t-eyebrow text-black/55 mb-5">Riwayat transaksi</div>
          {loading ? (
            <div className="flex items-center gap-3 text-black/50 py-6">
              <span className="spinner" aria-hidden /> Memuat…
            </div>
          ) : !history || history.data.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4">💸</div>
              <p className="t-body text-black/50">Belum ada transaksi. Mulai dengan isi saldo.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[var(--hairline-soft)]">
                {history.data.map((t) => {
                  const credit = t.type === "TOPUP" || t.type === "REFUND";
                  return (
                    <div key={t.id} className="flex items-center justify-between py-3.5">
                      <div>
                        <div className="t-body-sm" style={{ fontWeight: 500 }}>
                          {WALLET_TXN_LABELS[t.type] ?? t.type}
                        </div>
                        <div className="t-caption text-black/40 mt-0.5">
                          {t.description || "Transaksi dompet"} · {formatDateTime(t.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="t-body-sm"
                          style={{ fontWeight: 560, color: credit ? "var(--success)" : "#000" }}
                        >
                          {credit ? "+" : "−"} {formatIDR(t.amount)}
                        </div>
                        <div className="t-caption text-black/40">
                          Sisa: {formatIDR(t.balanceAfter)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between">
                  <button
                    className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-4 py-2 t-body-sm hover:border-black disabled:opacity-40 transition-colors"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Sebelumnya
                  </button>
                  <span className="t-caption text-black/40">{page} / {totalPages}</span>
                  <button
                    className="inline-flex items-center gap-2 rounded-[50px] border border-[var(--hairline)] px-4 py-2 t-body-sm hover:border-black disabled:opacity-40 transition-colors"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya →
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
