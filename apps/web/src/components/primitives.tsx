"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Star } from "lucide-react";

export const cx = (...c: (string | false | undefined | null)[]) =>
  c.filter(Boolean).join(" ");

/* ── Pill button ────────────────────────────────────────────────────── */
type PillVariant = "primary" | "secondary" | "magenta" | "ghost";

export function Pill({
  variant = "primary",
  className,
  children,
  ...rest
}: { variant?: PillVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[50px] px-5 py-2.5 text-base transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 select-none font-sans";
  const styles: Record<PillVariant, string> = {
    primary: "bg-black text-white hover:bg-neutral-800",
    secondary: "bg-background text-foreground border border-[var(--hairline)] hover:border-foreground",
    magenta: "text-white hover:brightness-105",
    ghost: "bg-transparent text-foreground hover:bg-[var(--surface-soft)]",
  };
  return (
    <button
      className={cx(base, styles[variant], className)}
      style={
        variant === "magenta"
          ? { background: "var(--accent-magenta)", fontWeight: 480, letterSpacing: "-0.01em" }
          : { fontWeight: 480, letterSpacing: "-0.01em" }
      }
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Color block section ────────────────────────────────────────────── */
type BlockColor = "lime" | "lilac" | "cream" | "pink" | "mint" | "coral" | "navy";

export function ColorBlock({
  color,
  children,
  className,
}: {
  color: BlockColor;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx("w-full px-8 py-12 sm:px-12 sm:py-16 rounded-[24px]", className)}
      style={{
        background: `var(--block-${color})`,
        color: `var(--on-${color})`,
      }}
    >
      {children}
    </section>
  );
}

/* ── Card ───────────────────────────────────────────────────────────── */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-[24px] border border-[var(--hairline)] bg-background p-6", className)}>
      {children}
    </div>
  );
}

/* ── Stars ──────────────────────────────────────────────────────────── */
export function Stars({
  value,
  size = 16,
  onChange,
  tone,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
  /** Optional ink color (e.g. an on-surface token) for stars sitting on a colored card. */
  tone?: string;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        return (
          <button
            key={i}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(i)}
            className={cx(onChange ? "cursor-pointer" : "cursor-default", "leading-none p-0 bg-transparent border-0")}
          >
            <Star
              size={size}
              className={tone ? undefined : filled ? "fill-foreground text-foreground" : "text-foreground/25"}
              style={tone ? { color: tone, fill: filled ? tone : "transparent", opacity: filled ? 1 : 0.3 } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ── Form field wrapper ─────────────────────────────────────────────── */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="t-caption mb-1.5 text-foreground/70">{label}</div>
      {children}
      {hint && <div className="mt-1 t-body-sm text-[var(--muted-foreground)]">{hint}</div>}
    </label>
  );
}

/* ── Text input ─────────────────────────────────────────────────────── */
export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-[8px] border border-[var(--hairline)] bg-input-bg px-3.5 py-3 t-body outline-none transition-colors focus:border-foreground focus:ring-2 focus:ring-foreground/10",
        props.className,
      )}
    />
  );
}

/* ── Textarea ───────────────────────────────────────────────────────── */
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-[8px] border border-[var(--hairline)] bg-input-bg px-3.5 py-3 t-body outline-none transition-colors focus:border-foreground focus:ring-2 focus:ring-foreground/10",
        props.className,
      )}
    />
  );
}

/* ── Status chip ────────────────────────────────────────────────────── */
export function Chip({ color, children }: { color?: BlockColor; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 t-caption"
      style={
        color
          ? { background: `var(--block-${color})`, color: `var(--on-${color})` }
          : { background: "var(--surface-soft)", color: "var(--foreground)" }
      }
    >
      {children}
    </span>
  );
}

export type { BlockColor };
