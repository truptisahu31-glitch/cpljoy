import { useEffect, useRef, useState } from "react";
import { Button, DigitRoll, RunsIcon, SmartImage } from "../champ/primitives";
import { useReducedMotion } from "@/lib/media";
import { TOTAL_RUNS, useRuns } from "@/lib/runs";
import { useSiteImages } from "@/lib/site-images";

function StoreBadges() {
  return (
    // A 2-up grid rather than a flex row: equal columns mean both badges are
    // exactly the same width at every breakpoint, instead of each sizing to the
    // length of its own label.
    <div className="mx-auto grid w-full max-w-[420px] grid-cols-1 gap-3 sm:grid-cols-2">
      <a
        href="https://apps.apple.com"
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-cream transition-transform hover:-translate-y-[2px]"
        aria-label="Download on the App Store"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.4 12.9c0-2.6 2.1-3.9 2.2-4-1.2-1.8-3.1-2-3.7-2.1-1.6-.1-3 .9-3.7.9-.8 0-1.9-.9-3.2-.9-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-3.5zM14.3 4.6c.7-.8 1.1-2 1-3.1-1 0-2.3.7-3 1.5-.7.8-1.2 2-1 3.1 1.1.1 2.3-.6 3-1.5z" />
        </svg>
        <span className="text-[14px] font-semibold">App Store</span>
      </a>
      <a
        href="https://play.google.com"
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-cream transition-transform hover:-translate-y-[2px]"
        aria-label="Get it on Google Play"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3.6 1.8 14 12 3.6 22.2A2 2 0 0 1 3 20.8V3.2a2 2 0 0 1 .6-1.4z" fill="#00D3FF" />
          <path d="M17.7 8.3 14 12 3.6 1.8c.3-.2.8-.2 1.2 0l12.9 6.5z" fill="#00F076" />
          <path d="M17.7 15.7 4.8 22.2c-.4.2-.9.2-1.2 0L14 12l3.7 3.7z" fill="#FF3A44" />
          <path d="M21.4 10.9c.8.5.8 1.7 0 2.2l-3.7 2.6L14 12l3.7-3.7 3.7 2.6z" fill="#FFC900" />
        </svg>
        <span className="text-[14px] font-semibold">Google Play</span>
      </a>
    </div>
  );
}

/**
 * The earned total, counted from 1 up to the real figure over ten seconds once
 * the section is on screen.
 *
 * The count starts only when the section is actually in view — running it while
 * the visitor is six sections above would mean they arrive to a number that has
 * already finished. It also always lands on the true balance: if the count is
 * still running when the visitor earns more Runs, it retargets from wherever it
 * is rather than restarting from 1.
 */
const COUNT_MS = 10_000;

function RunsCountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [shown, setShown] = useState(1);
  const from = useRef(1);

  // Own IntersectionObserver rather than `useInView`, which did not fire for
  // this element. The timer is the safety net: whatever happens to the
  // observer, the figure starts counting and reaches the real balance — a
  // number stuck at 1 would be a lie about what the visitor earned.
  useEffect(() => {
    if (started) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    const timer = window.setTimeout(() => setStarted(true), 8000);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [started]);

  useEffect(() => {
    if (!started) return;
    if (reduced || value <= 1) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    let done = false;

    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / COUNT_MS);
      // Ease out — quick off the mark, settling onto the figure at the end.
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.max(1, Math.round(start + (value - start) * eased)));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        done = true;
        from.current = value;
      }
    };
    raf = requestAnimationFrame(tick);

    // A backgrounded tab does not fire rAF at all, so a count that begins while
    // the page is hidden would never schedule a second frame and would sit at 1
    // forever once the visitor came back. Restart the loop on return; elapsed
    // time is measured from `t0`, so it resumes at the right point rather than
    // replaying from the start.
    const onVisible = () => {
      if (document.visibilityState !== "visible" || done || raf) return;
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [started, value, reduced]);

  return (
    <span ref={ref} className="tnum">
      {shown.toLocaleString("en-US")}
    </span>
  );
}

export function FinalCTA() {
  const { ctaBackground } = useSiteImages();
  const { balance, openAuth, track } = useRuns();
  const zero = balance === 0;
  const full = balance >= TOTAL_RUNS;

  return (
    <section id="final" className="surface-magenta relative scroll-mt-[56px] overflow-hidden md:scroll-mt-[66px]">
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <SmartImage src={ctaBackground} alt="" width={1600} height={900} className="h-full w-full opacity-[0.45]" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-gradient-to-b from-magenta/85 via-magenta/70 to-magenta/90" />
      <div aria-hidden="true" className="tex-confetti absolute inset-0 z-[1] text-cream" />

      <div className="relative z-[2] mx-auto flex max-w-[820px] flex-col items-center px-[clamp(20px,5vw,64px)] py-[clamp(30px,4vw,52px)] text-center">
        {zero ? (
          <>
            <h2 className="t-h2 text-cream">
              There are <DigitRoll value={TOTAL_RUNS} /> Runs on this page.
            </h2>
            <h2 className="t-h2 text-cream">You have not collected any.</h2>
            <p className="cream-muted t-sub mt-4">Takes about ninety seconds. Start with a prediction.</p>
            <div className="mt-6 w-full sm:w-auto">
              <Button
                variant="gold"
                full
                className="sm:w-auto"
                onClick={() => {
                  track("final_cta", { state: "zero" });
                  document.getElementById("call-it")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Play a prediction
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="t-h2 flex flex-wrap items-center justify-center gap-2 text-cream">
              <RunsIcon size={26} /> You earned <RunsCountUp value={balance} /> Runs.
            </h2>
            <h2 className="t-h2 text-cream">Keep them.</h2>
            <p className="cream-muted t-sub mt-4">
              {full
                ? "Free account. Thirty seconds. Every CPL match."
                : `Free account, thirty seconds — and there are ${TOTAL_RUNS - balance} more on this page.`}
            </p>
            <div className="mt-6 w-full sm:w-auto">
              <Button
                variant="gold"
                full
                className="sm:w-auto"
                onClick={() => {
                  track("final_cta", { state: full ? "full" : "partial" });
                  openAuth("final");
                }}
              >
                Sign up free
              </Button>
            </div>
          </>
        )}

        <div className="mt-8 w-full">
          <StoreBadges />
        </div>

        <p className="t-micro cream-muted mt-8">
          Free to play · No purchase necessary · Runs have no cash value
        </p>
      </div>
    </section>
  );
}
