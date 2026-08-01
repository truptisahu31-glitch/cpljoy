import { motion, useInView } from "motion/react";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { teamOf } from "@/content/site.config";
import { players } from "@/content/site.config";
import { useFinePointer, useReducedMotion } from "@/lib/media";
import { useSiteImages } from "@/lib/site-images";

/* ------------------------------------------------------------------ Button */

type Variant = "primary" | "ghost" | "outline" | "gold";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand text-cream border-2 border-brand hover:bg-brand-hover hover:border-brand-hover active:translate-y-[1px] active:bg-purple",
  gold: "bg-gold text-ink border-2 border-ink hover:bg-orange active:translate-y-[1px]",
  ghost:
    "bg-transparent text-current border-2 border-current/35 hover:border-current/70 active:translate-y-[1px]",
  outline:
    "bg-cream text-ink border-2 border-ink hover:bg-gold active:translate-y-[1px]",
};

/** The one button on the page. Sentence case, five explicit states. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", full, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-[56px] shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold",
        "transition-[background-color,border-color,transform,box-shadow] duration-150",
        "disabled:pointer-events-none disabled:opacity-40",
        "md:h-[52px]",
        full ? "w-full" : "",
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

/* ---------------------------------------------------------------- DigitRoll */

type DigitRollProps = {
  value: number;
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Roll time per column. Short values suit a counter driven by scroll, which
   *  has to keep up with the hand rather than make an entrance. */
  duration?: number;
};

/** Each digit column rolls 0–9, staggered left to right. Width never changes. */
export function DigitRoll({
  value,
  decimals = 0,
  className,
  prefix,
  suffix,
  duration = 900,
}: DigitRollProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [rolled, setRolled] = useState(false);
  const text = Math.abs(value).toFixed(decimals);
  const chars = (value < 0 ? "-" : "") + text;

  useEffect(() => {
    if (inView) setRolled(true);
  }, [inView]);

  /* Correctness floor for the roll.
     Until `rolled` flips, every column sits at 0 — so a counter whose observer
     never reports (offscreen at mount, inside a sticky block, a throttled
     background tab) renders as "000" instead of its value. The roll is
     decoration; the number is not. This releases it shortly after mount
     regardless, and the in-view path above still wins when it fires first. */
  useEffect(() => {
    const t = window.setTimeout(() => setRolled(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <span ref={ref} className={cn("tnum inline-flex items-baseline whitespace-nowrap", className)}>
      {prefix}
      {chars.split("").map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={`s-${i}`} aria-hidden="true">
              {ch}
            </span>
          );
        }
        const digit = Number(ch);
        const y = reduced || rolled ? -digit * 10 : 0;
        return (
          /* Keyed by position, not by the digit it currently shows.
             With the digit in the key every change unmounted the column and
             mounted a fresh one already at its final offset, so the roll this
             component exists for never actually played — the number snapped.
             Reusing the column lets the transition run, and it drops a mount
             and a paint per digit per change, which is what makes a counter
             driven by scroll cheap enough to track the hand. */
          <span
            key={`d-${i}`}
            aria-hidden="true"
            className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-baseline"
          >
            <span
              className="absolute left-0 top-0 flex flex-col transition-transform ease-out"
              style={{
                transform: `translateY(${y}%)`,
                transitionDuration: reduced ? "0ms" : `${duration}ms`,
                // The stagger reads as a cascade on a long roll and as lag on a
                // short one, so it scales with the duration.
                transitionDelay: reduced ? "0ms" : `${i * Math.round(duration / 22)}ms`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <span key={n} className="flex h-[1em] items-center justify-center leading-none">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
      {suffix}
      <span className="sr-only">
        {chars}
        {suffix}
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------- RunsIcon */

export function RunsIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <circle cx="12" cy="12" r="10" fill="var(--color-win)" />
      <path d="M6 5.6c4 3 6.6 8.2 6.9 13.4" stroke="#0b3c26" strokeWidth="1.6" fill="none" />
      <path d="M8.2 6.2c.7.6 1.3 1.3 1.9 2" stroke="#eafff4" strokeWidth="1.2" fill="none" />
      <path d="M10.6 9.4c.5.8 1 1.7 1.4 2.6" stroke="#eafff4" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/* ---------------------------------------------------------------- SmartImage */

type SmartImageProps = {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  treatment?: "none" | "duotone";
  tint?: string;
  style?: React.CSSProperties;
};

/** Blur-up placeholder, explicit dimensions, and a designed block on failure. */
export function SmartImage({
  src,
  alt,
  width,
  height,
  className,
  imgClassName,
  eager,
  treatment = "none",
  tint,
  style,
}: SmartImageProps) {
  const [state, setState] = useState<"loading" | "ok" | "fail">(src ? "loading" : "fail");
  const img = useRef<HTMLImageElement>(null);

  /* `onLoad` is not guaranteed to fire.
     An image that is already decoded when React attaches the handler — served
     from cache, or finished during hydration — has nothing left to announce, so
     the component sat at `loading` forever and the picture stayed at opacity 0
     behind the placeholder. Every deal card was a flat tint for this reason.
     Reading `complete` on mount closes the gap; `naturalWidth` distinguishes a
     decoded image from a broken one, which also reports `complete`. */
  useEffect(() => {
    const el = img.current;
    if (!el || state !== "loading") return;
    if (el.complete) {
      setState(el.naturalWidth > 0 ? "ok" : "fail");
      return;
    }
    // These images are server-rendered, so the browser starts fetching them
    // before React is running and the synthetic handler above can miss the
    // event outright. A native listener is bound to the element itself and
    // cannot be missed the same way.
    const ok = () => setState("ok");
    const bad = () => setState("fail");
    el.addEventListener("load", ok);
    el.addEventListener("error", bad);
    return () => {
      el.removeEventListener("load", ok);
      el.removeEventListener("error", bad);
    };
  }, [state, src]);

  if (state === "fail") {
    return (
      <div
        className={cn(
          "surface-cream-3 relative flex items-center justify-center overflow-hidden border-2 border-line",
          className,
        )}
        style={style}
      >
        <div aria-hidden="true" className="tex-chevron absolute inset-0 text-purple" />
        <span className="relative px-4 py-3 text-center text-[13px] font-semibold text-ink">{alt}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)} style={style}>
      {state === "loading" && (
        <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-cream-3" />
      )}
      <img
        ref={img}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setState("ok")}
        onError={() => setState("fail")}
        // Inline rather than `opacity-0`/`opacity-100`: those utilities are not
        // in this build's generated CSS, so the swap did nothing and every
        // photo stayed invisible behind its placeholder.
        style={{ opacity: state === "ok" ? 1 : 0 }}
        className={cn("h-full w-full object-cover transition-opacity duration-500", imgClassName)}
      />
      {treatment === "duotone" && tint && (
        <div
          aria-hidden="true"
          className="absolute inset-0 mix-blend-multiply"
          style={{ backgroundColor: tint, opacity: 0.55 }}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- TeamLogo */

/**
 * `color` and `logo` override the bundled team record.
 *
 * An uploaded week can name a side we don't ship art for, and `teamOf` answers
 * an unknown abbr with the first team — which would put Trinbago's crest and
 * pink beside someone else's name. Passing the resolved identity in lets the
 * caller say "no logo", and the abbr initials render instead.
 */
export function TeamLogo({
  abbr,
  size = 34,
  color,
  logo,
}: {
  abbr: string;
  size?: number;
  color?: string;
  logo?: string | null;
}) {
  const team = teamOf(abbr);
  const tint = color ?? team.color;
  const src = logo === undefined ? team.logo : logo;
  const [ok, setOk] = useState(false);
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-lg border-2"
      style={{
        width: size,
        height: size,
        borderColor: tint,
        backgroundColor: `${tint}2E`,
      }}
      aria-hidden="true"
    >
      {src && (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className={ok ? "h-full w-full object-contain" : "hidden"}
          onLoad={() => setOk(true)}
          onError={() => setOk(false)}
        />
      )}
      {!ok && (
        <span
          className="font-display leading-none"
          style={{ fontSize: Math.max(10, size * 0.36), color: tint }}
        >
          {abbr || team.abbr}
        </span>
      )}
    </span>
  );
}

/* --------------------------------------------------------------- PlayerImage */

export function PlayerImage({
  playerId,
  className,
  width = 1024,
  height = 1536,
  eager,
}: {
  playerId: string;
  /** The hero figure is above the fold — lazy loading left it blank. */
  eager?: boolean;
  className?: string;
  width?: number;
  height?: number;
}) {
  const player = players.find((p) => p.id === playerId);
  // An admin upload replaces the bundled cutout; the bundled one is the fallback.
  const { playerImage } = useSiteImages();
  const src = playerId === "pooran" ? playerImage : player?.image;
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div className={cn("relative", className)} aria-hidden="true">
        <svg viewBox="0 0 120 220" className="h-full w-full">
          <g fill="var(--color-purple)" opacity="0.35">
            <circle cx="60" cy="28" r="18" />
            <path d="M32 52h56l10 62-22 6 6 96H40l6-96-22-6z" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  );
}

/* ------------------------------------------------------------------- Reveal */

export function Reveal({
  label,
  children,
  align = "left",
  className,
}: {
  label: string;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const fine = useFinePointer();
  const [open, setOpen] = useState(false);
  const timers = useRef<{ open?: number; close?: number }>({});
  const id = useId();

  const show = () => {
    window.clearTimeout(timers.current.close);
    timers.current.open = window.setTimeout(() => setOpen(true), 120);
  };
  const hide = () => {
    window.clearTimeout(timers.current.open);
    timers.current.close = window.setTimeout(() => setOpen(false), 200);
  };

  return (
    <span
      className={cn("relative inline-block", className)}
      onMouseEnter={fine ? show : undefined}
      onMouseLeave={fine ? hide : undefined}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="inline-flex items-center gap-1.5 rounded-md border-2 border-current/30 px-2 py-1 text-[12px] font-semibold hover:border-current/70"
      >
        <span aria-hidden="true" className="font-display text-[14px] leading-none">
          +
        </span>
        {label}
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "surface-cream absolute bottom-[calc(100%+8px)] z-30 block w-[min(78vw,280px)] rounded-xl border-2 border-ink p-3 text-[13px] leading-snug shadow-[6px_6px_0_0_var(--color-purple)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------ SectionHeader */

export function SectionHeader({
  title,
  sub,
  accent = "var(--color-purple)",
  onCream = true,
}: {
  title: string;
  sub: string;
  accent?: string;
  onCream?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  return (
    <div ref={ref} className="w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="t-h2">{title}</h2>
        <p className={cn("t-sub", onCream ? "ink-muted" : "cream-muted")}>{sub}</p>
      </div>
      <div
        aria-hidden="true"
        className="mt-3 h-[3px] w-full origin-left rounded-full transition-transform duration-500 ease-out"
        style={{ backgroundColor: accent, transform: `scaleX(${inView ? 1 : 0})` }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- Skeleton */

export function Shimmer({ className }: { className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden rounded-md bg-ink/10", className)} aria-hidden="true">
      <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-cream/70 to-transparent" />
    </span>
  );
}

/* ------------------------------------------------------------ Wave divider */

export function WaveDivider({ from, to }: { from: string; to: string }) {
  return (
    <div aria-hidden="true" className="relative w-full" style={{ backgroundColor: from }}>
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="block h-[22px] w-full md:h-[30px]">
        <path
          d="M0 30 C 120 6, 240 6, 360 26 C 480 46, 600 46, 720 24 C 840 4, 960 4, 1080 26 C 1200 46, 1320 46, 1440 28 L1440 48 L0 48 Z"
          fill={to}
        />
      </svg>
    </div>
  );
}

/* --------------------------------------------------------------- Form pills */

export function FormPills({ form }: { form: string[] }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Recent form: ${form.join(", ")}`}>
      {form.map((f, i) => (
        <span
          key={i}
          className={cn(
            "grid h-5 w-5 place-items-center rounded-[5px] text-[10px] font-bold",
            f === "W" ? "bg-win text-cream" : "bg-loss text-cream",
          )}
        >
          {f}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ Movement */

export function Movement({ rank, prev, suppressed }: { rank: number; prev: number; suppressed?: boolean }) {
  if (suppressed) {
    return (
      <span className="t-micro ink-muted" title="Not enough matches played">
        —
      </span>
    );
  }
  const delta = prev - rank;
  if (delta === 0) {
    return (
      <span className="flex items-center gap-1 text-[13px] font-semibold">
        <span aria-hidden="true">—</span>
        <span className="sr-only">held position</span>
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span className="flex items-center gap-1 text-[13px] font-bold" style={{ color: up ? "var(--color-win)" : "var(--color-loss)" }}>
      <span aria-hidden="true">
        {up ? "▲" : "▼"}
        {Math.abs(delta)}
      </span>
      <span className="sr-only">{`${up ? "up" : "down"} ${Math.abs(delta)} place${Math.abs(delta) > 1 ? "s" : ""}`}</span>
    </span>
  );
}

/* --------------------------------------------------------- animated wrapper */

export function WipeIn({
  children,
  accent,
  delay = 0,
  className,
}: {
  children: ReactNode;
  accent: string;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 origin-left"
        style={{ backgroundColor: accent }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: [0, 1, 1, 0] }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6, times: [0, 0.4, 0.5, 1], delay, ease: "easeInOut" }}
      />
      {children}
    </motion.div>
  );
}
