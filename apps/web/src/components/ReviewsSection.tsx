"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { useToast } from "./toast";

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

const ChevronLeft = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m15 18-6-6 6-6" />
    </svg>
);
const ChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 18 6-6-6-6" />
    </svg>
);

export function ReviewsSection() {
    const toast = useToast();
    const [list, setList] = useState<ReviewList | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Carousel
    const trackRef = useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const syncEdges = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setAtStart(el.scrollLeft <= 4);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    }, []);

    function scrollByCards(dir: 1 | -1) {
        const el = trackRef.current;
        if (!el) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const amount = Math.max(280, el.clientWidth * 0.85);
        el.scrollBy({ left: dir * amount, behavior: reduce ? "auto" : "smooth" });
    }

    async function load() {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await api<ReviewList>("/reviews?limit=12", { auth: false });
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

    useEffect(() => {
        syncEdges();
    }, [list, syncEdges]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            toast.warning("Nama tidak boleh kosong.");
            return;
        }
        if (!comment.trim()) {
            toast.warning("Komentar tidak boleh kosong.");
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
        <section id="ulasan" className="container section">
            <div className="section-header">
                <h2 className="section-title">Apa kata pengguna Seapedia</h2>
                <p className="section-desc">
                    Ceritakan pengalamanmu memakai Seapedia. Tanpa perlu belanja
                    dulu, siapa pun boleh memberi ulasan.
                </p>
            </div>

            <div className="reviews-layout">
                {/* Left: summary + carousel */}
                <div className="reviews-main">
                    <div className="reviews-bar">
                        {hasReviews ? (
                            <div className="rating-summary">
                                <span className="rating-number">{avg.toFixed(1)}</span>
                                <div>
                                    <Stars value={Math.round(avg)} />
                                    <p className="muted" style={{ fontSize: "0.84rem", marginTop: 2 }}>
                                        dari {list!.total.toLocaleString("id-ID")} ulasan
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <span />
                        )}

                        {hasReviews && (
                            <div className="carousel-controls">
                                <button
                                    type="button"
                                    className="btn-icon"
                                    onClick={() => scrollByCards(-1)}
                                    disabled={atStart}
                                    aria-label="Ulasan sebelumnya"
                                >
                                    <ChevronLeft />
                                </button>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    onClick={() => scrollByCards(1)}
                                    disabled={atEnd}
                                    aria-label="Ulasan berikutnya"
                                >
                                    <ChevronRight />
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading-row">
                            <span className="spinner" aria-hidden /> Memuat ulasan…
                        </div>
                    ) : loadError ? (
                        <div className="notice notice-danger">{loadError}</div>
                    ) : hasReviews ? (
                        <div
                            className="carousel-track"
                            ref={trackRef}
                            onScroll={syncEdges}
                            tabIndex={0}
                            role="group"
                            aria-label="Galeri ulasan, gulir untuk melihat lainnya"
                        >
                            {list!.data.map((r) => (
                                <article key={r.id} className="carousel-card review-card">
                                    <Stars value={r.rating} />
                                    {/* Rendered as plain text; React escapes by default (XSS-safe) */}
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

                {/* Right: submit form */}
                <form className="panel reviews-form" onSubmit={handleSubmit}>
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
                            placeholder="Nama kamu…"
                            maxLength={60}
                            autoComplete="name"
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

                    <button
                        className="btn btn-primary btn-md btn-full"
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
