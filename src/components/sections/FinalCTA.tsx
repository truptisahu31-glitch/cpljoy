import { Button, DigitRoll, RunsIcon, SmartImage } from "../champ/primitives";
import { site } from "@/content/site.config";
import { TOTAL_RUNS, useRuns } from "@/lib/runs";

function StoreBadges() {
  return (
    <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
      <a
        href="https://apps.apple.com"
        className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-cream sm:w-auto"
        aria-label="Download on the App Store"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.4 12.9c0-2.6 2.1-3.9 2.2-4-1.2-1.8-3.1-2-3.7-2.1-1.6-.1-3 .9-3.7.9-.8 0-1.9-.9-3.2-.9-1.6 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-3.5zM14.3 4.6c.7-.8 1.1-2 1-3.1-1 0-2.3.7-3 1.5-.7.8-1.2 2-1 3.1 1.1.1 2.3-.6 3-1.5z" />
        </svg>
        <span className="text-[14px] font-semibold">App Store</span>
      </a>
      <a
        href="https://play.google.com"
        className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-cream sm:w-auto"
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

export function FinalCTA() {
  const { balance, openAuth, track } = useRuns();
  const zero = balance === 0;
  const full = balance >= TOTAL_RUNS;

  return (
    <section id="final" className="surface-magenta relative scroll-mt-[56px] overflow-hidden md:scroll-mt-[66px]">
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <SmartImage src={site.ctaBackground} alt="" width={1600} height={900} className="h-full w-full opacity-[0.45]" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-gradient-to-b from-magenta/85 via-magenta/70 to-magenta/90" />
      <div aria-hidden="true" className="tex-confetti absolute inset-0 z-[1] text-cream" />

      <div className="relative z-[2] mx-auto flex max-w-[820px] flex-col items-center px-[clamp(20px,5vw,64px)] py-[clamp(40px,6vw,72px)] text-center">
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
              <RunsIcon size={26} /> You earned <DigitRoll value={balance} /> Runs.
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
