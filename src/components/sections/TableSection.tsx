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
import { crowdFrames, rankings, site, teamOf, type Ranking } from "@/content/site.config";
import { SUBJECTS, WEIGHTS, computeRating } from "@/lib/rating";
import { useReducedMotion } from "@/lib/media";
import { useRuns } from "@/lib/runs";

const ACCENT = "var(--color-purple)";

function pointers(r: Ranking) {
  const best = r.marks.indexOf(Math.max(...r.marks));
  const worst = r.marks.indexOf(Math.min(...r.marks));
  const heavy = r.marks
    .map((m, i) => ({ m, i }))
    .filter(({ i }) => WEIGHTS[i] >= 0.08)
    .sort((a, b) => a.m - b.m)[0];
  const swing = r.prev - r.rank;
  return [
    { title: "What's working", body: `${SUBJECTS[best]}, ${r.marks[best]} out of 100.` },
    { title: "What isn't", body: `${SUBJECTS[worst]}, ${r.marks[worst]}. Their weakest subject.` },
    {
      title: "The swing",
      body: swing > 0 ? `Up ${swing} on last week.` : swing < 0 ? `Down ${-swing} on last week.` : "Held position.",
    },
    {
      title: "The watch",
      body: `${SUBJECTS[heavy.i]} at ${heavy.m} — worth ${Math.round(WEIGHTS[heavy.i] * 100)}%, so it moves them fastest.`,
    },
  ];
}

function ExpandPanel({ r, onClose }: { r: Ranking; onClose: () => void }) {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(reduced);
  const team = teamOf(r.abbr);
  const rating = computeRating(r.marks);

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
        <TeamLogo abbr={r.abbr} size={30} />
        <span className="font-display text-[18px]">{team.name}</span>
        <span className="t-micro rounded-md border-2 border-ink/20 px-2 py-1">
          Rating {rating.toFixed(1)}
        </span>
        <span className="t-micro ink-muted">
          {r.w}-{r.l}
        </span>
        <span className="t-micro ink-muted">NRR {r.nrr}</span>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <ul className="flex flex-col gap-2.5">
          {SUBJECTS.map((s, idx) => (
            <li key={s} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{s}</span>
                <span className="mt-1 block h-[10px] w-full overflow-hidden rounded-full bg-ink/10">
                  {ready ? (
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ backgroundColor: team.color, minWidth: 14 }}
                      initial={{ width: reduced ? `${r.marks[idx]}%` : 0 }}
                      animate={{ width: `${r.marks[idx]}%` }}
                      transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : idx * 0.04, ease: "easeOut" }}
                    />
                  ) : (
                    <Shimmer className="h-full w-full rounded-full" />
                  )}
                </span>
              </span>
              <span className="tnum w-[34px] text-right text-[13px] font-bold">
                {ready ? r.marks[idx] : "··"}
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
                <span aria-hidden="true" style={{ color: team.color }}>
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
  r: Ranking;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  const team = teamOf(r.abbr);
  const rating = computeRating(r.marks);
  const frame = crowdFrames[index % crowdFrames.length];
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
            <SmartImage src={frame.src} alt="" width={1280} height={640} className="absolute inset-0 h-full w-full opacity-[0.18]" treatment="duotone" tint={team.color} />
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[3px] origin-left scale-x-100 transition-[width] duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-full"
            style={{ backgroundColor: `${team.color}2B`, borderLeft: `3px solid ${team.color}` }}
          />

          <span
            className="relative font-display leading-none"
            style={{ fontSize: "clamp(40px, 7vw, 72px)", color: team.color }}
            aria-hidden="true"
          >
            {r.rank}
          </span>
          <span className="sr-only">Rank {r.rank}</span>

          <span className="relative w-[34px] shrink-0">
            <Movement rank={r.rank} prev={r.prev} suppressed={preseason} />
          </span>

          <TeamLogo abbr={r.abbr} size={34} />

          <span className="relative min-w-0 flex-1">
            <span className="block truncate font-display text-[16px] md:text-[19px]">
              <span className="sm:hidden">{team.short}</span>
              <span className="hidden sm:inline">{team.name}</span>
            </span>
          </span>

          <span className="relative hidden w-[120px] shrink-0 flex-col gap-1 sm:flex">
            <span className="flex items-baseline justify-between">
              <span className="t-micro ink-muted">Rating</span>
              <span className="tnum font-display text-[17px] leading-none">
                <DigitRoll value={rating} decimals={1} />
              </span>
            </span>
            <span className="relative block h-[6px] w-full overflow-hidden rounded-full bg-ink/10">
              <span aria-hidden="true" className="absolute inset-y-0 left-[30%] w-[40%] bg-ink/10" />
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${rating}%`, backgroundColor: team.color }} />
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
  const [openAbbr, setOpenAbbr] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const visible = showAll ? rankings : rankings.slice(0, 5);

  return (
    <section id="rankings" className="surface-cream relative scroll-mt-[56px] overflow-hidden md:scroll-mt-[66px]">
      <div aria-hidden="true" className="tex-scan absolute inset-0 z-0 text-purple" />

      <div className="relative z-[2] mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(32px,5vw,64px)]">
        <div ref={headerRef}>
          <SectionHeader title="The table" sub="Who's playing well. Not who's got points." accent={ACCENT} />
        </div>

        <p className="t-micro ink-muted mt-4">Powered by Champhunt AI · Updated Mondays, 9am ET</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {["01", "02", "03"].map((w, i) => (
            <button
              key={w}
              type="button"
              disabled={i !== 2}
              aria-current={i === 2}
              className={`h-9 min-w-[44px] rounded-lg border-2 px-3 text-[13px] font-bold ${
                i === 2 ? "border-ink bg-purple text-cream" : "border-ink/20 text-ink/40"
              }`}
            >
              {w}
            </button>
          ))}
          {site.seasonStatus === "final" && (
            <span className="t-micro rounded-md bg-gold px-2 py-1 text-ink">Final standings</span>
          )}
          {site.seasonStatus === "preseason" && (
            <span className="t-micro rounded-md bg-gold px-2 py-1 text-ink">Early season · limited data</span>
          )}
        </div>

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
            {showAll ? "Show top 5" : "Show all 7 teams"}
          </Button>
        </div>

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
