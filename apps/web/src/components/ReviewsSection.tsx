"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";

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

function Stars({ value }: { value: number }) {
    return (
        <span className="stars" aria-label={`${value} dari 5 bintang`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`star ${n <= value ? "" : "is-empty"}`} aria-hidden>
                    ★
                </span>
            ))}
        </span>
    );
}

export function ReviewsSection() {
    const [list, setList] = useState<ReviewList | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function load() {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await api<ReviewList>("/reviews?limit=6", { auth: false });
            setList(res);
        } catch {
            setLoadError("Gagal memuat ulasan. Coba muat ulang halaman.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setDone(false);
        if (!name.trim()) {
            setFormError("Nama tidak boleh kosong.");
            return;
        }
        if (!comment.trim()) {
            setFormError("Komentar tidak boleh kosong.");
            return;
        }
        setSubmitting(true);
        try {
            await api("/reviews", {
                method: "POST",
                auth: false,
                body: { reviewerName: name.trim(), rating, comment: comment.trim() },
            });
            setName("");
            setComment("");
            setRating(5);
            setDone(true);
            await load();
        } catch (err: any) {
            setFormError(err?.message ?? "Gagal mengirim ulasan.");
        } finally {
            setSubmitting(false);
        }
    }

    const avg = list?.averageRating ?? 0;

    return (
        <section id="ulasan" className="container section">
            <div className="section-header">
                <p className="eyebrow">Ulasan</p>
                <h2 className="section-title">Apa kata pengguna Seapedia</h2>
                <p className="section-desc">
                    Ceritakan pengalamanmu memakai Seapedia. Tanpa perlu belanja dulu —
                    siapa pun boleh memberi ulasan.
                </p>
            </div>

            {/* Average rating banner */}
            {list && list.total > 0 && (
                <div className="rating-banner">
                    <div className="rating-number">{avg.toFixed(1)}</div>
                    <div>
                        <Stars value={Math.round(avg)} />
                        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 2 }}>
                            dari {list.total.toLocaleString("id-ID")} ulasan
                        </p>
                    </div>
                </div>
            )}

            <div className="grid-2" style={{ alignItems: "start" }}>
                {/* Review list */}
                <div>
                    {loading ? (
                        <div className="loading-row">
                            <span className="spinner" aria-hidden /> Memuat ulasan…
                        </div>
                    ) : loadError ? (
                        <div className="notice notice-danger">{loadError}</div>
                    ) : list && list.data.length > 0 ? (
                        <div className="review-grid">
                            {list.data.map((r) => (
                                <article key={r.id} className="review-card">
                                    <Stars value={r.rating} />
                                    {/* Rendered as plain text — React escapes by default (XSS-safe) */}
                                    <p className="review-comment">{r.comment}</p>
                                    <div className="review-meta">
                                        <strong>{r.reviewerName}</strong>
                                        <span> · {formatDate(r.createdAt)}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">💬</div>
                            <div>
                                <h3 className="empty-state-title">Belum ada ulasan</h3>
                                <p className="empty-state-body">
                                    Jadilah yang pertama berbagi pengalaman tentang Seapedia.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit form */}
                <form className="panel" onSubmit={handleSubmit}>
                    <p className="panel-title">Tulis ulasan</p>
                    <p className="muted" style={{ fontSize: "0.86rem" }}>
                        Bagikan pendapatmu tentang aplikasi Seapedia.
                    </p>

                    <div className="field">
                        <label htmlFor="rev-name">Nama</label>
                        <input
                            id="rev-name"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nama kamu"
                            maxLength={60}
                        />
                    </div>

                    <div className="field">
                        <label>Rating</label>
                        <div className="stars" role="radiogroup" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    className={`star-input ${n <= rating ? "is-on" : ""}`}
                                    onClick={() => setRating(n)}
                                    role="radio"
                                    aria-checked={n === rating}
                                    aria-label={`${n} bintang`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="rev-comment">Komentar</label>
                        <textarea
                            id="rev-comment"
                            className="textarea"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Ceritakan pengalamanmu…"
                            maxLength={500}
                        />
                    </div>

                    {formError && <div className="notice notice-danger">{formError}</div>}
                    {done && (
                        <div className="notice notice-success">
                            Terima kasih! Ulasanmu sudah tampil di bawah.
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-full"
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting ? "Mengirim…" : "Kirim ulasan"}
                    </button>
                </form>
            </div>
        </section>
    );
}
