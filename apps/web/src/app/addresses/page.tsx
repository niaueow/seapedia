"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { useRequireRole, GuardGate } from "../../auth/useRequireRole";
import { useToast } from "../../components/toast";
import { Card, Pill, Field, TextInput, TextArea } from "../../components/primitives";

type Address = {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  fullAddress: string;
  city: string | null;
  postalCode: string | null;
  isDefault: boolean;
};

type FormState = {
  label: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
};

const EMPTY: FormState = {
  label: "", recipientName: "", phone: "", fullAddress: "", city: "", postalCode: "", isDefault: false,
};

export default function AddressesPage() {
  const guard = useRequireRole("BUYER");
  const toast = useToast();

  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try { setItems(await api<Address[]>("/addresses")); }
    catch { setError("Hmm, alamatnya belum kebuka. Coba muat ulang ya."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (guard.ready) load(); }, [guard.ready]);
  if (!guard.ready) return <GuardGate state={guard} />;

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY, isDefault: items.length === 0 });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(a: Address) {
    setEditId(a.id);
    setForm({ label: a.label ?? "", recipientName: a.recipientName, phone: a.phone, fullAddress: a.fullAddress, city: a.city ?? "", postalCode: a.postalCode ?? "", isDefault: a.isDefault });
    setFormError(null);
    setModalOpen(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.recipientName.trim() || !form.phone.trim() || !form.fullAddress.trim()) {
      setFormError("Isi dulu nama penerima, nomor telepon, dan alamat lengkapnya ya.");
      return;
    }
    setSubmitting(true);
    const body = {
      label: form.label.trim() || undefined,
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      fullAddress: form.fullAddress.trim(),
      city: form.city.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      isDefault: form.isDefault,
    };
    try {
      if (editId) await api(`/addresses/${editId}`, { method: "PATCH", body });
      else await api("/addresses", { method: "POST", body });
      setModalOpen(false);
      toast.success(editId ? "Alamat sudah diperbarui." : "Alamat sudah disimpan.");
      await load();
    } catch (e) {
      const msg = (e as ApiError).message || "Yah, alamatnya belum kesimpan. Coba lagi ya.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false); }
  }

  async function setDefault(a: Address) {
    setBusyId(a.id);
    try {
      await api(`/addresses/${a.id}`, { method: "PATCH", body: { isDefault: true } });
      toast.success("Sip, ini jadi alamat utamamu sekarang.");
      await load();
    } catch { toast.error("Yah, belum berhasil. Coba lagi sebentar ya."); }
    finally { setBusyId(null); }
  }

  async function remove(a: Address) {
    if (!confirm("Yakin mau hapus alamat ini?")) return;
    setBusyId(a.id);
    try {
      await api(`/addresses/${a.id}`, { method: "DELETE" });
      toast.success("Alamat sudah dihapus.");
      await load();
    } catch { toast.error("Yah, alamatnya belum kehapus. Coba lagi ya."); }
    finally { setBusyId(null); }
  }

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="t-display-lg">Alamat pengiriman</h1>
          <p className="t-body-lg mt-2 text-foreground/65">Atur alamat biar pesananmu nyampe ke tempat yang pas.</p>
        </div>
        <Pill onClick={openCreate} className="shrink-0 mt-2">
          <Plus size={16} /> Tambah
        </Pill>
      </div>

      {error && (
        <div className="mb-6 rounded-[16px] bg-red-50 border border-red-200 px-6 py-4 t-body-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-20 flex items-center justify-center gap-3 text-foreground/50">
          <span className="spinner" aria-hidden /> Sebentar ya…
        </div>
      ) : items.length === 0 ? (
        <div className="mt-24 text-center">
          <h3 className="t-headline">Belum ada alamat</h3>
          <p className="mt-2 t-body-lg text-foreground/55">Tambah satu alamat dulu biar bisa lanjut checkout.</p>
          <button
            onClick={openCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-[50px] bg-black px-5 py-2.5 text-white hover:bg-neutral-800 transition-colors"
            style={{ fontWeight: 480 }}
          >
            Tambah alamat
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Card key={a.id} className="relative">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-soft)]">
                    <MapPin size={15} />
                  </div>
                  <span className="t-body-sm" style={{ fontWeight: 560 }}>{a.label || "Alamat"}</span>
                </div>
                {a.isDefault && (
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 t-caption bg-[var(--block-lime)]"
                    style={{ color: "var(--on-lime)" }}
                  >
                    Utama
                  </span>
                )}
              </div>
              <div className="t-body-sm" style={{ fontWeight: 560 }}>{a.recipientName}</div>
              <div className="t-body-sm text-foreground/55 mt-0.5">{a.phone}</div>
              <div className="t-body-sm text-foreground/55 mt-1 overflow-wrap-anywhere">
                {a.fullAddress}{a.city ? `, ${a.city}` : ""}{a.postalCode ? ` ${a.postalCode}` : ""}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!a.isDefault && (
                  <button
                    onClick={() => setDefault(a)}
                    disabled={busyId === a.id}
                    className="inline-flex items-center gap-1.5 rounded-[50px] border border-[var(--hairline)] px-3.5 py-1.5 t-caption hover:border-foreground disabled:opacity-40 transition-colors"
                  >
                    Jadikan utama
                  </button>
                )}
                <button
                  onClick={() => openEdit(a)}
                  disabled={busyId === a.id}
                  className="inline-flex items-center gap-1.5 rounded-[50px] border border-[var(--hairline)] px-3.5 py-1.5 t-caption hover:border-foreground disabled:opacity-40 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(a)}
                  disabled={busyId === a.id}
                  className="inline-flex items-center gap-1.5 rounded-[50px] px-3.5 py-1.5 t-caption text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => !submitting && setModalOpen(false)}
        >
          <form
            className="w-full max-w-[480px] rounded-[24px] bg-background p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h2 className="t-headline mb-5">{editId ? "Ubah alamat" : "Alamat baru"}</h2>

            <div className="space-y-4">
              <Field label="Label (opsional)">
                <TextInput value={form.label} onChange={(e) => update("label", e.target.value)} placeholder="Rumah, Kantor…" />
              </Field>
              <Field label="Nama penerima">
                <TextInput value={form.recipientName} onChange={(e) => update("recipientName", e.target.value)} />
              </Field>
              <Field label="Nomor telepon">
                <TextInput value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="0812xxxx" />
              </Field>
              <Field label="Alamat lengkap">
                <TextArea value={form.fullAddress} onChange={(e) => update("fullAddress", e.target.value)} rows={3} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Kota (opsional)">
                  <TextInput value={form.city} onChange={(e) => update("city", e.target.value)} />
                </Field>
                <Field label="Kode pos (opsional)">
                  <TextInput value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer t-body-sm">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => update("isDefault", e.target.checked)} />
                Jadikan alamat utama
              </label>

              {formError && (
                <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 t-body-sm text-red-700">{formError}</div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 rounded-[50px] border border-[var(--hairline)] py-2.5 t-body-sm hover:border-foreground disabled:opacity-40 transition-colors"
                >
                  Batal
                </button>
                <Pill type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Sebentar ya…" : "Simpan"}
                </Pill>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
