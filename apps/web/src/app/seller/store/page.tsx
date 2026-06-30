"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store as StoreIcon } from "lucide-react";
import { api, ApiError } from "../../../lib/api";
import { useRequireRole, GuardGate } from "../../../auth/useRequireRole";
import { useToast } from "../../../components/toast";
import { Card, ColorBlock, Pill, Field, TextInput, TextArea } from "../../../components/primitives";

type Store = { id: string; name: string; description: string | null };

export default function SellerStorePage() {
  const guard = useRequireRole("SELLER");
  const toast = useToast();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const s = await api<Store | null>("/stores/mine");
      setStore(s);
      if (s) { setName(s.name); setDescription(s.description ?? ""); }
    } catch { setLoadError("Gagal memuat data toko."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (guard.ready) load(); }, [guard.ready]);
  if (!guard.ready) return <GuardGate state={guard} />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!name.trim()) { setFormError("Nama toko wajib diisi."); return; }
    setSaving(true);
    const body = { name: name.trim(), description: description.trim() || undefined };
    try {
      if (store) {
        const updated = await api<Store>(`/stores/${store.id}`, { method: "PATCH", body });
        setStore(updated);
        setSuccess("Perubahan toko tersimpan.");
        toast.success("Perubahan toko tersimpan.");
      } else {
        const created = await api<Store>("/stores", { method: "POST", body });
        setStore(created);
        setSuccess("Toko berhasil dibuat!");
        toast.success("Toko berhasil dibuat.");
      }
    } catch (e) {
      const err = e as ApiError;
      const msg = err.status === 409 ? "Nama toko sudah dipakai. Pilih nama lain." : (err.message || "Gagal menyimpan toko.");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="mb-8">
        <div className="t-eyebrow text-black/55 mb-3">Manajemen toko</div>
        <h1 className="t-display-lg">{store ? "Profil toko" : "Buat toko"}</h1>
        <p className="t-body-lg mt-2 text-black/65">
          {store ? "Perbarui identitas tokomu di Seapedia." : "Buat toko untuk mulai berjualan. Nama toko harus unik."}
        </p>
      </div>

      {loadError && (
        <div className="mb-6 rounded-[16px] bg-red-50 border border-red-200 px-6 py-4 t-body-sm text-red-700">{loadError}</div>
      )}

      {loading ? (
        <div className="mt-20 flex items-center justify-center gap-3 text-black/50">
          <span className="spinner" aria-hidden /> Memuat…
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[480px_1fr]">
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <div className="t-eyebrow text-black/55 mb-4">{store ? "Edit informasi" : "Informasi toko"}</div>
              <div className="space-y-4">
                <Field label="Nama toko">
                  <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="cth: Toko Maju Jaya"
                    maxLength={80}
                  />
                </Field>
                <Field label="Deskripsi (opsional)">
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ceritakan tentang tokomu…"
                    rows={4}
                    maxLength={500}
                  />
                </Field>

                {formError && (
                  <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 t-body-sm text-red-700">{formError}</div>
                )}
                {success && (
                  <div className="rounded-[8px] bg-green-50 border border-green-200 px-4 py-3 t-body-sm text-green-700">{success}</div>
                )}

                <Pill type="submit" disabled={saving} className="w-full">
                  {saving ? "Menyimpan…" : store ? "Simpan perubahan" : "Buat toko"}
                </Pill>
              </div>
            </Card>
          </form>

          {/* Store preview */}
          {store ? (
            <ColorBlock color="lilac" className="!py-8 !px-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-black/10">
                  <StoreIcon size={20} />
                </div>
                <div className="t-eyebrow text-black/60">Toko aktif</div>
              </div>
              <div className="t-headline mb-2">{store.name}</div>
              <p className="t-body-sm text-black/65 mb-6">
                {store.description || "Belum ada deskripsi."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/seller/products"
                  className="inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors t-body-sm"
                  style={{ fontWeight: 480 }}
                >
                  Kelola produk
                </Link>
                <Link
                  href={`/products?storeId=${store.id}`}
                  className="inline-flex items-center gap-2 rounded-[50px] border border-black/30 px-5 py-2.5 hover:border-black transition-colors t-body-sm"
                  style={{ fontWeight: 480 }}
                >
                  Lihat halaman publik
                </Link>
              </div>
            </ColorBlock>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--hairline)] flex items-center justify-center p-10">
              <div className="text-center">
                <div className="text-4xl mb-4">🏪</div>
                <p className="t-body-sm text-black/45">
                  Isi formulir di samping untuk membuat tokomu. Setelah toko dibuat, kamu bisa menambahkan produk.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
