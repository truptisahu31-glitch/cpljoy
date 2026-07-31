import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Button,
  DigitRoll,
  FormPills,
  Movement,
  SectionHeader,
  Shimmer,
  SmartImage,
  TeamLogo,
} from "../champ/primitives";
import { site } from "@/content/site.config";
import { useReducedMotion } from "@/lib/media";
import { useRankings } from "@/lib/use-rankings";
import type { Row as TeamRow } from "@/lib/rankings";
import { useRuns } from "@/lib/runs";
import { useSiteImages } from "@/lib/site-images";

const ACCENT = "var(--color-purple)";

/** A factor worth this much or more moves a team fastest — the "watch" line. */
const HEAVY_WEIGHT = 8;

function pointers(r: TeamRow) {
  const f = r.factors;
  if (f.length === 0) return [];

  const best = f.reduce((a, b) => (b.mark > a.mark ? b : a));
  const worst = f.reduce((a, b) => (b.mark < a.mark ? b : a));
  const heavy = f.filter((x) => x.weight >= HEAVY_WEIGHT).sort((a, b) => a.mark - b.mark)[0];
  const swing = r.prev - r.rank;

  return [
    { title: "What's working", body: `${best.name}, ${best.mark} out of 100.` },
    { title: "What isn't", body: `${worst.name}, ${worst.mark}. Their weakest subject.` },
    {
      title: "The swing",
      body: swing > 0 ? `Up ${swing} on last week.` : swing < 0 ? `Down ${-swing} on last week.` : "Held position.",
    },
    ...(heavy
      ? [
          {
            title: "The watch",
            body: `${heavy.name} at ${heavy.mark} — worth ${Math.round(heavy.weight)}%, so it moves them fastest.`,
          },
        ]
      : []),
  ];
}

function ExpandPanel({ r, onClose }: { r: TeamRow; onClose: () => void }) {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(t);
  }, [reduced]);

  return (
    <div
      className="surface-cream-2 border-t-2 border-line px-4 py-5 md:px-6"
      tabIndex={-1}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="flex flex-wrap items-center gap-3">
        <TeamLogo abbr={r.abbr} size={30} color={r.color} logo={r.logo} />
        <span className="font-display text-[18px]">{r.name}</span>
        <span className="t-micro rounded-md border-2 border-ink/20 px-2 py-1">
          Rating {r.rating.toFixed(1)}
        </span>
        <span className="t-micro ink-muted">
          {r.w}-{r.l}
        </span>
        <span className="t-micro ink-muted">NRR {r.nrr}</span>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <ul className="flex flex-col gap-2.5">
          {r.factors.map((f, idx) => (
            <li key={f.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{f.name}</span>
                <span className="mt-1 block h-[10px] w-full overflow-hidden rounded-full bg-ink/10">
                  {ready ? (
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ backgroundColor: r.color, minWidth: 14 }}
                      initial={{ width: reduced ? `${f.mark}%` : 0 }}
                      animate={{ width: `${f.mark}%` }}
                      transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : idx * 0.04, ease: "easeOut" }}
                    />
                  ) : (
                    <Shimmer className="h-full w-full rounded-full" />
                  )}
                </span>
              </span>
              <span className="tnum w-[34px] text-right text-[13px] font-bold">
                {ready ? f.mark : "··"}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3">
          {pointers(r).map((p, idx) =>
            ready ? (
              <motion.div
                key={p.title}
                initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0 : 0.45 + idx * 0.08, duration: 0.3 }}
                className="flex gap-2"
              >
                <span aria-hidden="true" style={{ color: r.color }}>
                  ◆
                </span>
                <p className="text-[14px]">
                  <span className="font-semibold">{p.title}. </span>
                  <span className="ink-muted">{p.body}</span>
                </p>
              </motion.div>
            ) : (
              <Shimmer key={p.title} className="h-4 w-[85%]" />
            ),
          )}
          {/* Only a published week carries prose. */}
          {r.blurb && ready && <p className="ink-muted text-[13px] italic">{r.blurb}</p>}
          <p className="ink-muted mt-1 text-[12px]">Every number above is an input to the rating.</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <button type="button" className="text-[13px] font-semibold underline" onClick={onClose}>
              Compare with…
            </button>
            <a href="/methodology" className="text-[13px] font-semibold text-purple underline">
              Full method →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  r,
  open,
  onToggle,
  index,
}: {
  r: TeamRow;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  const { crowdFrames: frames } = useSiteImages();
  const frame = frames[index % frames.length];
  const preseason = site.seasonStatus === "preseason";

  return (
    <li className="relative overflow-hidden border-b-2 border-line last:border-b-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="group relative flex min-h-[76px] w-full items-center gap-3 px-3 text-left md:min-h-[68px] md:gap-4 md:px-5"
        >
          {/* team-tinted photo, revealed on hover only where hover is real */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
            <SmartImage src={frame.src} alt="" width={1280} height={640} className="absolute inset-0 h-full w-full opacity-[0.18]" treatment="duotone" tint={r.color} />
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[3px] origin-left scale-x-100 transition-[width] duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-full"
            style={{ backgroundColor: `${r.color}2B`, borderLeft: `3px solid ${r.color}` }}
          />

          <span
            className="relative font-display leading-none"
            style={{ fontSize: "clamp(40px, 7vw, 72px)", color: r.color }}
            aria-hidden="true"
          >
            {r.rank}
          </span>
          <span className="sr-only">Rank {r.rank}</span>

          <span className="relative w-[34px] shrink-0">
            <Movement rank={r.rank} prev={r.prev} suppressed={preseason} />
          </span>

          <TeamLogo abbr={r.abbr} size={34} color={r.color} logo={r.logo} />

          <span className="relative min-w-0 flex-1">
            <span className="block truncate font-display text-[16px] md:text-[19px]">
              <span className="sm:hidden">{r.short}</span>
              <span className="hidden sm:inline">{r.name}</span>
            </span>
          </span>

          <span className="relative hidden w-[120px] shrink-0 flex-col gap-1 sm:flex">
            <span className="flex items-baseline justify-between">
              <span className="t-micro ink-muted">Rating</span>
              <span className="tnum font-display text-[17px] leading-none">
                <DigitRoll value={r.rating} decimals={1} />
              </span>
            </span>
            <span className="relative block h-[6px] w-full overflow-hidden rounded-full bg-ink/10">
              <span aria-hidden="true" className="absolute inset-y-0 left-[30%] w-[40%] bg-ink/10" />
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${r.rating}%`, backgroundColor: r.color }} />
            </span>
          </span>

          <span className="relative hidden md:block">
            <FormPills form={r.form} />
          </span>

          <span aria-hidden="true" className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-ink/25 font-display text-[15px]">
            {open ? "–" : "+"}
          </span>
        </button>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <ExpandPanel r={r} onClose={onToggle} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function TableSection() {
  const { credit, track } = useRuns();
  const { weeks, selected, view, loading, error, show } = useRankings();
  const [openAbbr, setOpenAbbr] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const rows = view.rows;
  const visible = showAll ? rows : rows.slice(0, 5);

  // One button per published week. With nothing published there is exactly one
  // week to show — the bundled table — so the selector still reads as a real
  // control rather than disappearing.
  const buttons = weeks.length > 0 ? weeks.map((w) => w.week) : [view.week];
  const active = selected ?? view.week;

  return (
    <section
      id="rankings"
      className="surface-cream relative scroll-mt-[56px] overflow-hidden md:scroll-mt-[66px]"
    >
      <div aria-hidden="true" className="tex-scan absolute inset-0 z-0 text-purple" />

      <div className="relative z-[2] mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(24px,3.4vw,44px)]">
        <div ref={headerRef}>
          <SectionHeader title="The table" sub="Who's playing well. Not who's got points." accent={ACCENT} />
        </div>

        <p className="t-micro ink-muted mt-4">Powered by Champhunt AI</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {buttons.map((w) => {
            const on = w === active;
            return (
              <button
                key={w}
                type="button"
                aria-current={on}
                aria-label={`Week ${w} power rankings`}
                disabled={loading}
                onClick={() => {
                  if (on) return;
                  // Collapse first: the open row belongs to the week being
                  // replaced, and the same abbr in another week is a different
                  // set of numbers under an identical heading.
                  setOpenAbbr(null);
                  track("week_selected", { week: w });
                  void show(w);
                }}
                className={`h-9 min-w-[44px] rounded-lg border-2 px-3 text-[13px] font-bold transition-colors disabled:opacity-60 ${
                  on
                    ? "border-ink bg-purple text-cream"
                    : "border-ink/20 text-ink/60 hover:border-ink/50 hover:text-ink"
                }`}
              >
                {String(w).padStart(2, "0")}
              </button>
            );
          })}
          {loading && <span className="t-micro ink-muted">Loading…</span>}
          {site.seasonStatus === "final" && (
            <span className="t-micro rounded-md bg-gold px-2 py-1 text-ink">Final standings</span>
          )}
          {site.seasonStatus === "preseason" && (
            <span className="t-micro rounded-md bg-gold px-2 py-1 text-ink">Early season · limited data</span>
          )}
        </div>

        {error && <p className="ink-muted mt-3 text-[13px]">{error}</p>}

        {site.seasonStatus === "preseason" && (
          <p className="ink-muted mt-3 text-[13px]">No matches played yet. This is a squad-strength projection.</p>
        )}

        <ul className="surface-cream-2 mt-5 overflow-hidden rounded-2xl border-2 border-ink">
          {visible.map((r, i) => (
            <Row
              key={r.abbr}
              r={r}
              index={i}
              open={openAbbr === r.abbr}
              onToggle={() => {
                const next = openAbbr === r.abbr ? null : r.abbr;
                setOpenAbbr(next);
                if (next) {
                  credit("row-expand");
                  track("row_expanded", { team: r.abbr });
                }
              }}
            />
          ))}
        </ul>

        {rows.length > 5 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                const next = !showAll;
                setShowAll(next);
                track("show_all_teams", { open: next });
                if (next) credit("show-all");
                else headerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              {showAll ? "Show top 5" : `Show all ${rows.length} teams`}
            </Button>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            className="text-ink"
            onClick={() => {
              track("methodology_link", { from: "table" });
              window.location.href = "/methodology";
            }}
          >
            Think we're wrong?
          </Button>
        </div>
      </div>
    </section>
  );
}
