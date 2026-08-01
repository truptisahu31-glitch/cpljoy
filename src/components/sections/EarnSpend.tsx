import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Coins, Gift, Lock, Target } from "lucide-react";
import { Button, DigitRoll, RunsIcon, SectionHeader, SmartImage } from "../champ/primitives";
import { useReducedMotion } from "@/lib/media";
import { useRuns } from "@/lib/runs";
import { useSiteImages } from "@/lib/site-images";

const ACCENT = "var(--color-gold)";

/** Each step owns a colour, so the strip reads as a progression rather than
 *  three identical cards. Redeem is green — it is the payoff. */
const steps = [
  {
    icon: Target,
    label: "Predict",
    line: "Answer the questions you've got an opinion on.",
    tint: "var(--color-purple)",
  },
  {
    icon: Coins,
    label: "Win Runs",
    line: "Right calls pay. Wrong ones don't.",
    tint: "var(--color-gold)",
  },
  {
    icon: Gift,
    label: "Redeem",
    line: "Spend them on real things from real brands.",
    tint: "var(--color-win)",
  },
];

type Deal = ReturnType<typeof useSiteImages>["deals"][number];

/** The last card unlocks at this point in the block's travel, leaving a beat
 *  where every card is green before it scrolls away. */
const ALL_GREEN_AT = 0.85;

/**
 * Turns the deals block's own travel through the viewport into a Runs figure.
 *
 * There is no pin. A pin has to reserve the scroll distance it consumes, and
 * that reserve is empty page — on a tall window it showed as a screenful of
 * blank below the cards, and the only ways to hide it are to stretch the stage
 * or the cards, both of which change the layout. So the block simply scrolls,
 * and its position does the work: the total climbs from the moment the cards
 * appear at the bottom of the viewport until they reach the top. Nothing is
 * reserved, nothing is resized, and the unlock still happens under the hand.
 *
 * Nothing in the frame loop reads layout. The block's document offset is
 * measured once and re-measured only when the page actually reflows, so each
 * frame is `scrollY` plus arithmetic — a `getBoundingClientRect` here would
 * force a synchronous layout on every frame of every scroll on the page.
 * `runs` is the one piece of state and is set only when the snapped value
 * truly changes, so an unchanged step costs no render at all.
 *
 * Scrubs both ways — scrolling back up walks the total down and re-locks.
 */
function useScrollUnlock(
  stage: React.RefObject<HTMLDivElement | null>,
  max: number,
  active: boolean,
) {
  const [runs, setRuns] = useState(0);

  useEffect(() => {
    if (!active) return;
    const el = stage.current;
    if (!el) return;

    let raf = 0;
    let start = 0;
    let travel = 1;
    let last = -1;

    /** The only layout read, outside the frame loop. */
    const measure = () => {
      const header = window.matchMedia("(min-width: 768px)").matches ? 66 : 56;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top + window.scrollY;
      // Nothing until the cards edge into view; complete by the time they sit
      // under the header. Clamped so a viewport shorter than the block still
      // gets a sane run rather than a division that snaps 0 → all at once.
      start = top - vh;
      travel = Math.max(240, vh - header);
    };

    const frame = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / travel));
      const eased = Math.min(1, p / ALL_GREEN_AT);
      const snapped = Math.round((eased * max) / 100) * 100;
      if (snapped !== last) {
        last = snapped;
        setRuns(snapped);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Images and fonts landing above this section move it down the document,
    // and a pinch-zoom reflows everything; without re-measuring, the unlock
    // would run against stale geometry.
    const ro = new ResizeObserver(onResize);
    ro.observe(document.documentElement);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [stage, max, active]);

  return runs;
}

/**
 * One deal.
 *
 * Memoised, and deliberately given `open` and `shortfall` rather than the raw
 * `runs`: an unlocked card's props then stop changing entirely, so four of the
 * five drop out of the render pass while the scrub is still climbing. Only the
 * cards that still have a number to count down actually re-render.
 */
const DealCard = memo(function DealCard({
  deal,
  open,
  shortfall,
  onTouch,
  onAct,
}: {
  deal: Deal;
  open: boolean;
  shortfall: number;
  onTouch: () => void;
  onAct: (deal: Deal, state: "ready" | "locked") => void;
}) {
  return (
    <li
      // The deal-touch credit used to hang off the Terms disclosure. With that
      // gone, engaging with the card itself is the signal.
      onClickCapture={onTouch}
      onMouseEnter={onTouch}
      style={{
        borderColor: open ? "var(--color-win)" : "var(--color-ink)",
        boxShadow: open ? "0 0 0 3px color-mix(in oklab, var(--color-win) 25%, transparent)" : "none",
      }}
      className="surface-cream group flex h-full w-[82vw] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border-2 transition-[border-color,box-shadow] duration-300 sm:w-[62vw] lg:w-auto"
    >
      <div className="relative h-[180px] shrink-0 overflow-hidden">
        <SmartImage
          src={deal.image}
          alt={deal.alt}
          width={1080}
          height={720}
          className="h-full w-full transition-transform duration-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.03]"
        />
        <span
          aria-hidden="true"
          className={`absolute inset-0 mix-blend-multiply transition-opacity duration-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-0 ${
            open ? "bg-purple/10" : "bg-purple/35"
          }`}
        />
        {/* Unlocked badge — the at-a-glance answer to "can I afford this yet?"
            as the total climbs. */}
        <span
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition-all duration-300 ${
            open ? "bg-win text-white opacity-100" : "bg-ink/70 text-cream opacity-90"
          }`}
        >
          {open ? <Check size={13} aria-hidden="true" /> : <Lock size={12} aria-hidden="true" />}
          {open ? "Unlocked" : "Locked"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="t-micro ink-muted">{deal.cat}</span>

        {/* Two lines' worth, always — the row below must not shift. */}
        <span className="flex min-h-[44px] items-start text-[15px] font-semibold leading-snug">
          {deal.offer}
        </span>

        <span className="flex h-[22px] items-center gap-1.5 text-[14px] font-bold">
          <RunsIcon size={15} className={open ? "" : "opacity-40"} />
          <span className={open ? "text-win" : "opacity-60"}>
            <DigitRoll value={deal.cost} />
          </span>
        </span>

        <div className="mt-auto pt-1">
          {open ? (
            // Green, matching the unlocked border and the Redeem step — the
            // payoff state should look different from a CTA.
            <Button
              full
              onClick={() => onAct(deal, "ready")}
              className="border-2 text-white"
              style={{ backgroundColor: "var(--color-win)", borderColor: "var(--color-win)" }}
            >
              <Check size={16} aria-hidden="true" />
              Redeem
            </Button>
          ) : (
            <Button variant="outline" full onClick={() => onAct(deal, "locked")}>
              Earn {shortfall.toLocaleString()} more
            </Button>
          )}
        </div>
      </div>
    </li>
  );
});

/**
 * "What would N Runs get me?"
 *
 * The slider is a preview, not the wallet: it starts at whatever the visitor has
 * actually earned and follows that until they drag it, at which point it holds
 * their figure and the caption says plainly what they really hold. Cards light
 * from this number, so the section answers the question without needing an
 * account.
 */
function SpendSlider({
  runs,
  balance,
  deals,
  touched,
  onChange,
  onReset,
}: {
  runs: number;
  balance: number;
  deals: Deal[];
  touched: boolean;
  onChange: (v: number) => void;
  onReset: () => void;
}) {
  const max = deals.reduce((m, d) => Math.max(m, d.cost), 0);
  const unlocked = deals.filter((d) => runs >= d.cost);
  // The cheapest thing still out of reach — what the next drag actually buys.
  const next = deals
    .filter((d) => runs < d.cost)
    .sort((a, b) => a.cost - b.cost)[0];

  return (
    <div className="surface-cream mt-6 rounded-2xl border-2 border-ink p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="t-micro ink-muted">Spend it</span>
        <span className="flex items-center gap-2 font-display text-[26px] leading-none">
          <RunsIcon size={20} />
          <DigitRoll value={runs} duration={160} /> Runs
        </span>
        <span className="text-[14px] font-semibold">
          {unlocked.length} of {deals.length} unlocked
        </span>
        {touched && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto text-[13px] font-semibold text-purple underline underline-offset-4"
          >
            Follow my scroll again
          </button>
        )}
      </div>

      <input
        type="range"
        min={0}
        max={max}
        step={100}
        value={Math.min(runs, max)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Runs to spend"
        className="mt-3 h-11 w-full accent-[var(--color-win)]"
      />

      {/* One tick per deal, sitting at its real cost along the track, so the
          jumps in the slider have a visible meaning. Green once passed. */}
      <div className="relative h-5" aria-hidden="true">
        {deals.map((d) => {
          const open = runs >= d.cost;
          return (
            <span
              key={d.id}
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: `${(d.cost / max) * 100}%` }}
            >
              <span
                className={`block h-2.5 w-[3px] rounded-full transition-colors ${
                  open ? "bg-win" : "bg-ink/25"
                }`}
              />
            </span>
          );
        })}
      </div>

      <p className="ink-muted text-[13px]">
        {next ? (
          <>
            <strong className="font-semibold text-ink">
              {(next.cost - runs).toLocaleString()} more
            </strong>{" "}
            unlocks {next.offer}.
          </>
        ) : (
          "Everything is unlocked."
        )}
        {touched ? ` Preview only — you've earned ${balance.toLocaleString()} so far.` : ""}
      </p>
    </div>
  );
}

export function EarnSpend() {
  const { deals } = useSiteImages();
  const { balance, credit, openAuth, track } = useRuns();

  // `null` means "follow the scroll". Dragging the slider pins a figure and
  // takes the value off the scrub until the reset button hands it back.
  const [sim, setSim] = useState<number | null>(null);

  const sorted = useMemo(() => [...deals].sort((a, b) => a.cost - b.cost), [deals]);
  const maxCost = useMemo(() => sorted.reduce((m, d) => Math.max(m, d.cost), 0), [sorted]);

  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  // Reduced motion keeps the old behaviour: no pin, no scrub, the figure just
  // follows what the visitor has actually earned.
  const scrub = !reduced;
  const scrollRuns = useScrollUnlock(stage, maxCost, scrub);
  const runs = sim ?? (scrub ? scrollRuns : balance);

  /* Phone: walk the rail along with the unlocks.
     Only one card fits the screen at a time, so without this the scrub unlocks
     four cards the visitor never sees. The rail is a scroll container of its
     own — moving `scrollLeft` cannot disturb the page's vertical scroll, which
     `scrollIntoView` would. No-ops on `lg`, where the rail is a five-column
     grid with nothing to scroll. */
  const unlockedCount = sorted.filter((d) => runs >= d.cost).length;
  useEffect(() => {
    const el = rail.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    // Park on the newest unlocked card, or the first still-locked one at the
    // start, so there is always a card in view rather than a gap.
    const card = el.children[Math.max(0, unlockedCount - 1)] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, [unlockedCount]);

  // Stable identities, so a memoised card is not re-rendered by a new closure
  // on every step of the scrub.
  const touch = useCallback(() => credit("deal-touch"), [credit]);

  /** Every card action ends at the real product's sign-in. */
  const goToAuth = useCallback(
    (deal: Deal, state: "ready" | "locked") => {
      touch();
      track("redeem_attempted", { deal: deal.id, state });
      openAuth("deals");
    },
    [touch, track, openAuth],
  );

  return (
    // No `overflow-hidden` here: it would make this section the scroll
    // container for the sticky child below, and the pin would never engage.
    <section id="deals" className="surface-cream-2 relative scroll-mt-[56px] md:scroll-mt-[66px]">
      <div aria-hidden="true" className="tex-perf absolute inset-0 z-0 text-gold" />

      <div className="relative z-[2] mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(24px,3.4vw,44px)]">
        <SectionHeader title="Earn. Spend." sub="Be right, get Runs. Spend them on things you want." accent={ACCENT} />

        {/* One control per step, not two.
            Each step used to render a small "+ Predict" reveal chip *above* an
            identical-looking card, so every step appeared twice. The chip is
            gone; the card itself carries the explanation, revealed on hover or
            focus. Slimmer, tinted per step, and keyboard-reachable. */}
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.label} className="relative">
              <div
                tabIndex={0}
                aria-label={`${s.label} — ${s.line}`}
                className="group/step flex h-[64px] items-center gap-3 rounded-xl border-2 px-4 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-[2px] focus-visible:-translate-y-[2px] focus-visible:outline-none"
                style={{
                  borderColor: s.tint,
                  backgroundColor: `color-mix(in oklab, ${s.tint} 12%, var(--color-cream))`,
                }}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklab, ${s.tint} 22%, transparent)` }}
                >
                  <s.icon size={20} aria-hidden="true" style={{ color: s.tint }} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[17px] leading-none">{s.label}</span>
                  {/* Held at a fixed height so revealing it cannot shift the row. */}
                  <span className="ink-muted mt-1 block truncate text-[12px] opacity-0 transition-opacity duration-200 group-hover/step:opacity-100 group-focus-visible/step:opacity-100">
                    {s.line}
                  </span>
                </span>
                {i < 2 && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                    className="ml-auto hidden h-[3px] w-8 origin-left rounded-full sm:block"
                    style={{ backgroundColor: s.tint }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* The block whose travel drives the unlock. Plain flow — no reserved
            scroll, no transform, so there is no empty tail underneath it. */}
        <div ref={stage}>
          <SpendSlider
            runs={runs}
            balance={balance}
            deals={sorted}
            touched={sim !== null}
            onChange={setSim}
            onReset={() => setSim(null)}
          />

          {/* `items-stretch` (the flex default) plus `h-full` on each card makes
              every card the same height, and the fixed row slots inside line the
              cost and action rows up across all five — the offer text runs to
              two lines on some cards, which used to push everything below it
              out of step. */}
          <ul
            ref={rail}
            className="mt-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-5 lg:overflow-visible"
          >
            {sorted.map((d) => (
              <DealCard
                key={d.id}
                deal={d}
                open={runs >= d.cost}
                shortfall={d.cost - runs}
                onTouch={touch}
                onAct={goToAuth}
              />
            ))}
          </ul>
        </div>

        {/* Arrives once every card has gone green. */}
        <div className="mt-8 flex justify-center">
          <Button className="w-full sm:w-auto" onClick={() => openAuth("deals")}>
            Claim your Runs
          </Button>
        </div>
      </div>
    </section>
  );
}
