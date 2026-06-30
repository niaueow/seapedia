"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { useToast } from "./toast";
import { Stars, Field, TextInput, TextArea, Pill } from "./primitives";

type Review = {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewList = {
  data: Review[];
  total: number;
  averageRating: number;
};

const BLOCK_COLORS = ["lime", "lilac", "cream", "pink"] as const;

export function ReviewsSection() {
  const toast = useToast();
  const [list, setList] = useState<ReviewList | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api<ReviewList>("/reviews?limit=12", { auth: false });
      setList(res);
    } catch {
      setLoadError("Gagal memuat ulasan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.warning("Nama tidak boleh kosong."); return; }
    if (!comment.trim()) { toast.warning("Komentar tidak boleh kosong."); return; }
    setSubmitting(true);
    try {
      await api("/reviews", {
        method: "POST",
        auth: false,
        body: { reviewerName: name.trim(), rating, comment: comment.trim() },
      });
      setName(""); setComment(""); setRating(5);
      toast.success("Terima kasih! Ulasanmu sudah tampil.");
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal mengirim ulasan.");
    } finally {
      setSubmitting(false);
    }
  }

  const avg = list?.averageRating ?? 0;
  const hasReviews = !!list && list.data.length > 0;

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="t-display-lg">Ulasan pengalaman</h2>
        </div>
        {hasReviews && (
          <div className="t-body-sm text-black/50">
            {avg.toFixed(1)} dari {list!.total} ulasan
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-black/50">
          <span className="spinner" aria-hidden /> Memuat ulasan…
        </div>
      ) : loadError ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-6 py-5 t-body-sm text-red-700">
          {loadError}
        </div>
      ) : hasReviews ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list!.data.map((r, i) => (
            <article
              key={r.id}
              className="rounded-[24px] px-6 py-6"
              style={{ background: `var(--block-${BLOCK_COLORS[i % BLOCK_COLORS.length]})` }}
            >
              <Stars value={r.rating} size={15} />
              <p className="mt-3 t-body">{r.comment}</p>
              <div className="mt-4 t-caption text-black/50">
                {r.reviewerName} · {formatDate(r.createdAt)}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-[var(--hairline)] bg-white px-6 py-12 text-center">
          <p className="t-body text-black/50">Belum ada ulasan. Jadilah yang pertama.</p>
        </div>
      )}

      <div className="mt-8 rounded-[24px] border border-[var(--hairline)] bg-white p-6 sm:p-8">
        <div className="t-card-title mb-1">Tulis ulasan</div>
        <p className="t-body-sm mb-5 text-black/55">
          Bagikan pendapatmu tentang Seapedia.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu…"
              maxLength={60}
              autoComplete="name"
            />
          </Field>
          <Field label="Rating">
            <div className="mt-1">
              <Stars value={rating} size={24} onChange={setRating} />
            </div>
          </Field>
          <Field label="Komentar">
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalamanmu…"
              maxLength={500}
              rows={3}
            />
          </Field>
          <Pill type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Mengirim…" : "Kirim ulasan"}
          </Pill>
        </form>
      </div>
    </section>
  );
}
