"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api, ApiError } from "../../../lib/api";
import { useRequireRole, GuardGate } from "../../../auth/useRequireRole";
import { formatIDR } from "../../../lib/format";
import { useToast } from "../../../components/toast";
import { Card, Pill, Field, TextInput, TextArea } from "../../../components/primitives";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
};

type ProductList = { data: Product[]; page: number; limit: number; total: number };

type FormState = {
  name: string; description: string; price: string; stock: string; imageUrl: string; isActive: boolean;
};

const EMPTY: FormState = { name: "", description: "", price: "", stock: "", imageUrl: "", isActive: true };
const LIMIT = 10;

export default function SellerProductsPage() {
  const guard = useRequireRole("SELLER");
  const toast = useToast();

  const [list, setList] = useState<ProductList | null>(null);
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [store, products] = await Promise.all([
        api<{ id: string } | null>("/stores/mine"),
        api<ProductList>(`/products/mine?page=${page}&limit=${LIMIT}`),
      ]);
      setHasStore(!!store);
      setList(products);
    } catch { setError("Gagal memuat produk."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (guard.ready) load(); }, [guard.ready, page]);
  if (!guard.ready) return <GuardGate state={guard} />;

  function openCreate() { setEditId(null); setForm(EMPTY); setFormError(null); setModalOpen(true); }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description ?? "", price: String(p.price), stock: String(p.stock), imageUrl: p.imageUrl ?? "", isActive: p.isActive });
    setFormError(null);
    setModalOpen(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const price = Math.floor(Number(form.price));
    const stock = Math.floor(Number(form.stock));
    if (!form.name.trim()) { setFormError("Nama produk wajib diisi."); return; }
    if (!Number.isFinite(price) || price < 0) { setFormError("Harga harus berupa angka bulat ≥ 0."); return; }
    if (!Number.isFinite(stock) || stock < 0) { setFormError("Stok harus berupa angka bulat ≥ 0."); return; }
    setSaving(true);
    try {
      if (editId) {
        await api(`/products/${editId}`, {
          method: "PATCH",
          body: { name: form.name.trim(), description: form.description.trim() || undefined, price, stock, imageUrl: form.imageUrl.trim() || undefined, isActive: form.isActive },
        });
      } else {
        await api("/products", {
          method: "POST",
          body: { name: form.name.trim(), description: form.description.trim() || undefined, price, stock, imageUrl: form.imageUrl.trim() || undefined },
        });
      }
      setModalOpen(false);
      toast.success(editId ? "Produk diperbarui." : "Produk ditambahkan.");
      await load();
    } catch (e) {
      const msg = (e as ApiError).message || "Gagal menyimpan produk.";
      setFormError(msg);
      toast.error(msg);
    } finally { setSaving(false); }
  }

  async function softDelete(p: Product) {
    if (!confirm(`Nonaktifkan "${p.name}"? Produk akan disembunyikan dari katalog.`)) return;
    setBusyId(p.id);
    try {
      await api(`/products/${p.id}`, { method: "DELETE" });
      toast.success(`"${p.name}" dinonaktifkan.`);
      await load();
    } catch { toast.error("Gagal menghapus produk."); }
    finally { setBusyId(null); }
  }

  async function reactivate(p: Product) {
    setBusyId(p.id);
    try {
      await api(`/products/${p.id}`, { method: "PATCH", body: { isActive: true } });
      toast.success(`"${p.name}" diaktifkan kembali.`);
      await load();
    } catch { toast.error("Gagal mengaktifkan produk."); }
    finally { setBusyId(null); }
  }

  const totalPages = list ? Math.max(1, Math.ceil(list.total / LIMIT)) : 1;

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="t-eyebrow text-black/55 mb-3">Manajemen toko</div>
          <h1 className="t-display-lg">Produk saya</h1>
          <p className="t-body-lg mt-2 text-black/65">Kelola produk yang dijual di tokomu.</p>
        </div>
        {hasStore && (
          <Pill onClick={openCreate} className="shrink-0 mt-2">
            <Plus size={16} /> Tambah produk
          </Pill>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-[16px] bg-red-50 border border-red-200 px-6 py-4 t-body-sm text-red-700">{error}</div>
      )}

      {hasStore === false && (
        <div className="mb-6 rounded-[16px] bg-amber-50 border border-amber-200 px-6 py-4 t-body-sm text-amber-800">
          Kamu belum punya toko.{" "}
          <Link href="/seller/store" className="font-bold underline">Buat toko</Link>{" "}
          dulu sebelum menambahkan produk.
        </div>
      )}

      {loading ? (
        <div className="mt-20 flex items-center justify-center gap-3 text-black/50">
          <span className="spinner" aria-hidden /> Memuat…
        </div>
      ) : !list || list.data.length === 0 ? (
        hasStore !== false && (
          <div className="mt-24 text-center">
            <div className="text-5xl mb-5">📦</div>
            <h3 className="t-headline">Belum ada produk</h3>
            <p className="mt-2 t-body-lg text-black/55">Tambahkan produk pertamamu agar muncul di katalog publik.</p>
            <button
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
              style={{ fontWeight: 480 }}
            >
              Tambah produk
            </button>
          </div>
        )
      ) : (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--hairline)] bg-[var(--surface-soft)]">
                    <th className="text-left px-6 py-3.5 t-caption" style={{ fontWeight: 560 }}>Produk</th>
                    <th className="text-left px-6 py-3.5 t-caption" style={{ fontWeight: 560 }}>Harga</th>
                    <th className="text-left px-6 py-3.5 t-caption" style={{ fontWeight: 560 }}>Stok</th>
                    <th className="text-left px-6 py-3.5 t-caption" style={{ fontWeight: 560 }}>Status</th>
                    <th className="text-right px-6 py-3.5 t-caption" style={{ fontWeight: 560 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline-soft)]">
                  {list.data.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-soft)] transition-colors">
                      <td className="px-6 py-4 t-body-sm" style={{ fontWeight: 540 }}>{p.name}</td>
                      <td className="px-6 py-4 t-body-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{formatIDR(p.price)}</td>
                      <td className="px-6 py-4 t-body-sm">{p.stock}</td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 t-caption"
                          style={{
                            background: p.isActive ? "var(--block-lime)" : "var(--block-pink)",
                            fontWeight: 540,
                          }}
                        >
                          {p.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          className="inline-flex items-center rounded-[50px] border border-[var(--hairline)] px-3.5 py-1.5 t-caption hover:border-black disabled:opacity-40 transition-colors mr-2"
                          onClick={() => openEdit(p)}
                          disabled={busyId === p.id}
                        >
                          Edit
                        </button>
                        {p.isActive ? (
                          <button
                            className="inline-flex items-center rounded-[50px] px-3.5 py-1.5 t-caption text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                            onClick={() => softDelete(p)}
                            disabled={busyId === p.id}
                          >
                            Nonaktifkan
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center rounded-[50px] px-3.5 py-1.5 t-caption text-green-700 hover:bg-green-50 disabled:opacity-40 transition-colors"
                            onClick={() => reactivate(p)}
                            disabled={busyId === p.id}
                          >
                            Aktifkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

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

      {/* Product modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => !saving && setModalOpen(false)}
        >
          <form
            className="w-full max-w-[500px] rounded-[24px] bg-white p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="t-eyebrow text-black/55 mb-3">{editId ? "Edit" : "Tambah"} produk</div>
            <h2 className="t-headline mb-5">{editId ? "Perbarui produk" : "Produk baru"}</h2>

            <div className="space-y-4">
              <Field label="Nama produk">
                <TextInput value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={120} />
              </Field>
              <Field label="Deskripsi (opsional)">
                <TextArea value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={1000} rows={3} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Harga (Rp)">
                  <TextInput type="number" min={0} step={1} value={form.price} onChange={(e) => update("price", e.target.value)} />
                </Field>
                <Field label="Stok">
                  <TextInput type="number" min={0} step={1} value={form.stock} onChange={(e) => update("stock", e.target.value)} />
                </Field>
              </div>
              <Field label="URL gambar (opsional)">
                <TextInput type="url" value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} placeholder="https://…" />
              </Field>
              {editId && (
                <label className="flex items-center gap-2 cursor-pointer t-body-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
                  Produk aktif (tampil di katalog)
                </label>
              )}

              {formError && (
                <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 t-body-sm text-red-700">{formError}</div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="flex-1 rounded-[50px] border border-[var(--hairline)] py-2.5 t-body-sm hover:border-black disabled:opacity-40 transition-colors"
                >
                  Batal
                </button>
                <Pill type="submit" disabled={saving} className="flex-1">
                  {saving ? "Menyimpan…" : "Simpan"}
                </Pill>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
