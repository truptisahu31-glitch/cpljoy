import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button, DigitRoll, RunsIcon, SectionHeader, SmartImage, TeamLogo } from "../champ/primitives";
import { challenge as bundled, heroSlides } from "@/content/site.config";
import { challengeFrom } from "@/lib/editable-questions";
import { useSiteContent } from "@/lib/use-site-content";
import { useRuns } from "@/lib/runs";

const ACCENT = "var(--color-orange)";
type State = "idle" | "answered" | "staking" | "locked";

export function BackYourself() {
  const content = useSiteContent();
  const edits = challengeFrom(content);
  const challenge = { ...bundled, ...edits };
  const { credit, openAuth, track } = useRuns();
  const [state, setState] = useState<State>("idle");
  const [answer, setAnswer] = useState<string | null>(null);
  const [stake, setStake] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [resolved, setResolved] = useState(false);
  const balance = challenge.demoBalance;
  const chips = [...challenge.stakes, balance];

  useEffect(() => {
    if (state !== "locked") return;
    // No auto-redirect on the win. The visitor reads the result and chooses
    // where to go from the two buttons underneath it.
    const t = window.setTimeout(() => {
      setResolved(true);
      credit("challenge-won");
    }, 2000);
    return () => window.clearTimeout(t);
  }, [state, credit]);

  const payout = (stake ?? 0) * challenge.payout_multiplier;

  return (
    <section id="back-yourself" className="surface-cream-3 relative scroll-mt-[56px] overflow-hidden md:scroll-mt-[66px]">
      <div aria-hidden="true" className="tex-arcs absolute inset-0 z-0 text-orange" />
      <div aria-hidden="true" className="absolute inset-0 z-[1]">
        <SmartImage src={heroSlides[1].src} alt="" width={1920} height={1088} className="h-full w-full opacity-[0.22]" />
        <span className="absolute inset-0 bg-gradient-to-r from-cream-3 via-cream-3/60 to-cream-3" />
      </div>

      <div className="relative z-[2] mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(24px,3.4vw,44px)]">
        <SectionHeader title="Back yourself" sub="Right, it doubles. Wrong, it's gone." accent={ACCENT} />

        <div className="mt-8 flex justify-center">
          <div className="surface-cream w-full max-w-[620px] rounded-2xl border-2 border-ink p-5 shadow-[6px_6px_0_0_var(--color-orange)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-micro flex items-center gap-2 rounded-full bg-live px-2.5 py-1 text-cream">
                <span aria-hidden="true" className="h-2 w-2 animate-live rounded-full bg-cream" />
                Live tonight
              </span>
              <TeamLogo abbr={challenge.team_abbrs[0]} size={26} />
              <TeamLogo abbr={challenge.team_abbrs[1]} size={26} />
            </div>

            <p className="mt-3 font-display text-[19px]">{challenge.fixture_label}</p>
            <p className="mt-3 text-[16px] font-semibold">{challenge.question}</p>

            {state === "idle" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {challenge.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setAnswer(o.id);
                      setState("answered");
                      track("challenge_answered", { answer: o.id });
                    }}
                    className="surface-cream-2 flex min-h-[76px] items-center justify-center rounded-xl border-[3px] border-ink text-[18px] font-semibold transition-transform [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-[2px]"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {(state === "answered" || state === "staking") && (
              <div className="mt-4">
                <p className="text-[15px] font-semibold">How many Runs?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((c, i) => {
                    const isAllIn = i === chips.length - 1;
                    const affordable = c <= balance;
                    return (
                      <button
                        key={`${c}-${i}`}
                        type="button"
                        aria-disabled={!affordable}
                        title={!affordable ? `You've got ${balance}. Win a couple and come back.` : undefined}
                        onClick={() => {
                          if (!affordable) {
                            setShake(i);
                            window.setTimeout(() => setShake(null), 220);
                            return;
                          }
                          setStake(c);
                          setState("staking");
                          track("stake_chip_selected", { amount: c });
                        }}
                        className={`relative flex h-[48px] min-w-[88px] items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-[14px] font-bold ${
                          stake === c ? "border-ink bg-gold text-ink" : "border-ink/30 text-ink"
                        } ${!affordable ? "opacity-30 line-through" : ""} ${shake === i ? "animate-shake" : ""}`}
                      >
                        <RunsIcon size={14} />
                        {isAllIn ? `All in · ${c}` : c}
                        {isAllIn && affordable && (
                          <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                            <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-cream/70 to-transparent" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {stake !== null && (
                  <p className="mt-3 text-[15px] font-semibold">
                    If you're right: <DigitRoll value={payout} /> Runs
                  </p>
                )}
                <p className="mt-1 text-[12px] font-bold">Everything here is free to play.</p>

                <div className="mt-4 flex justify-center">
                  <Button
                    full
                    disabled={stake === null}
                    className="sm:w-auto"
                    onClick={() => {
                      setState("locked");
                      credit("challenge-locked");
                      track("challenge_locked", { amount: stake, answer });
                    }}
                  >
                    Lock it in — {stake ?? challenge.min_stake} Runs
                  </Button>
                </div>
              </div>
            )}

            {state === "locked" && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`mt-4 rounded-xl border-2 border-ink bg-cream-2 p-4 text-center ${
                  resolved ? "animate-flash-win" : ""
                }`}
              >
                {!resolved ? (
                  <>
                    <p className="flex flex-wrap items-center justify-center gap-1.5 font-display text-[18px]">
                      <RunsIcon size={16} /> Locked · <DigitRoll value={stake ?? 0} /> Runs staked ·{" "}
                      <DigitRoll value={payout} /> back if he gets there
                    </p>
                    <p className="ink-muted mt-1 text-[13px]">Settles the moment Pooran is out or the innings ends.</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-[22px]" style={{ color: "var(--color-win)" }}>
                      You were right.
                    </p>
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-[15px] font-semibold">
                      <RunsIcon size={15} /> <DigitRoll value={payout} /> Runs returned.
                    </p>
                    <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                      <Button onClick={() => openAuth("challenge")}>Keep my Runs</Button>
                      <Button
                        variant="ghost"
                        className="text-ink"
                        onClick={() => openAuth("challenge")}
                      >
                        Try another
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => document.getElementById("deals")?.scrollIntoView({ behavior: "smooth" })}
          >
            See what Runs buy
          </Button>
        </div>
      </div>
    </section>
  );
}
