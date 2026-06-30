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
    } catch { setLoadError("Hmm, data tokonya belum kebuka. Coba muat ulang ya."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (guard.ready) load(); }, [guard.ready]);
  if (!guard.ready) return <GuardGate state={guard} />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!name.trim()) { setFormError("Isi dulu nama tokonya ya."); return; }
    setSaving(true);
    const body = { name: name.trim(), description: description.trim() || undefined };
    try {
      if (store) {
        const updated = await api<Store>(`/stores/${store.id}`, { method: "PATCH", body });
        setStore(updated);
        setSuccess("Perubahan tokomu sudah kesimpan.");
        toast.success("Perubahan tokomu sudah kesimpan.");
      } else {
        const created = await api<Store>("/stores", { method: "POST", body });
        setStore(created);
        setSuccess("Tokomu sudah jadi! Yuk, isi produk pertamamu.");
        toast.success("Tokomu sudah jadi!");
      }
    } catch (e) {
      const err = e as ApiError;
      const msg = err.status === 409 ? "Nama toko ini sudah dipakai. Coba nama lain yang khas tokomu ya." : (err.message || "Yah, tokonya belum kesimpan. Coba lagi sebentar ya.");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="mb-8">
        <h1 className="t-display-lg">{store ? "Profil toko" : "Buka toko"}</h1>
        <p className="t-body-lg mt-2 text-foreground/65">
          {store ? "Perbarui identitas tokomu kapan aja." : "Buka tokomu dan mulai jualan ke pembeli sekitar. Nama toko harus unik ya."}
        </p>
      </div>

      {loadError && (
        <div className="mb-6 rounded-[16px] bg-red-50 border border-red-200 px-6 py-4 t-body-sm text-red-700">{loadError}</div>
      )}

      {loading ? (
        <div className="mt-20 flex items-center justify-center gap-3 text-foreground/50">
          <span className="spinner" aria-hidden /> Sebentar ya…
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[480px_1fr]">
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
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
                    placeholder="Ceritakan soal tokomu, biar pembeli makin kenal."
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
                  {saving ? "Sebentar ya…" : store ? "Simpan perubahan" : "Buka toko"}
                </Pill>
              </div>
            </Card>
          </form>

          {/* Store preview */}
          {store ? (
            <ColorBlock color="lilac" className="!py-8 !px-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "var(--on-lilac-line)" }}>
                  <StoreIcon size={20} />
                </div>
              </div>
              <div className="t-headline mb-2">{store.name}</div>
              <p className="t-body-sm mb-6" style={{ color: "var(--on-lilac-soft)" }}>
                {store.description || "Belum ada deskripsi toko."}
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
                  className="inline-flex items-center gap-2 rounded-[50px] border px-5 py-2.5 hover:opacity-70 transition-opacity t-body-sm"
                  style={{ fontWeight: 480, borderColor: "var(--on-lilac-line)" }}
                >
                  Lihat halaman publik
                </Link>
              </div>
            </ColorBlock>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--hairline)] flex items-center justify-center p-10">
              <div className="text-center">
                <p className="t-body-sm text-foreground/45">
                  Isi formulir di samping buat buka tokomu. Habis itu, kamu bisa langsung tambah produk.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
