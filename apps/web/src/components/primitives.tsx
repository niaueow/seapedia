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
    secondary: "bg-white text-black border border-[var(--hairline)] hover:border-black",
    magenta: "text-white hover:brightness-105",
    ghost: "bg-transparent text-black hover:bg-[var(--surface-soft)]",
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

const BLOCK_HEX: Record<BlockColor, string> = {
  lime: "#dceeb1",
  lilac: "#c5b0f4",
  cream: "#f4ecd6",
  pink: "#efd4d4",
  mint: "#c8e6cd",
  coral: "#f3c9b6",
  navy: "#1f1d3d",
};

export function ColorBlock({
  color,
  children,
  className,
}: {
  color: BlockColor;
  children: ReactNode;
  className?: string;
}) {
  const dark = color === "navy";
  return (
    <section
      className={cx(
        "w-full px-8 py-12 sm:px-12 sm:py-16 rounded-[24px]",
        dark ? "text-white" : "text-black",
        className,
      )}
      style={{ background: BLOCK_HEX[color] }}
    >
      {children}
    </section>
  );
}

/* ── Card ───────────────────────────────────────────────────────────── */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-[24px] border border-[var(--hairline)] bg-white p-6", className)}>
      {children}
    </div>
  );
}

/* ── Stars ──────────────────────────────────────────────────────────── */
export function Stars({
  value,
  size = 16,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          className={cx(onChange ? "cursor-pointer" : "cursor-default", "leading-none p-0 bg-transparent border-0")}
        >
          <Star
            size={size}
            className={i <= value ? "fill-black text-black" : "text-black/25"}
          />
        </button>
      ))}
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
      <div className="t-caption mb-1.5 text-black/70">{label}</div>
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
        "w-full rounded-[8px] border border-[var(--hairline)] bg-white px-3.5 py-3 t-body outline-none transition-colors focus:border-black focus:ring-2 focus:ring-black/10",
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
        "w-full rounded-[8px] border border-[var(--hairline)] bg-white px-3.5 py-3 t-body outline-none transition-colors focus:border-black focus:ring-2 focus:ring-black/10",
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
          ? { background: BLOCK_HEX[color], color: color === "navy" ? "#fff" : "#000" }
          : { background: "var(--surface-soft)", color: "#000" }
      }
    >
      {children}
    </span>
  );
}

export { BLOCK_HEX };
export type { BlockColor };
