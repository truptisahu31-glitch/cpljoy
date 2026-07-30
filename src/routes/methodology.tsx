import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button, DigitRoll, Reveal, TeamLogo } from "@/components/champ/primitives";
import { SUBJECTS, WEIGHTS, computeRating } from "@/lib/rating";
import { rankings, teamOf } from "@/content/site.config";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "How the CPL 2026 power rankings are built | Champhunt" },
      {
        name: "description",
        content:
          "Nine measurements, the weights we fitted, the ones we rejected, and a sandbox where you can re-weight the table yourself.",
      },
      { property: "og:title", content: "How the CPL 2026 power rankings are built" },
      {
        property: "og:description",
        content: "The formulas, the fitted weights, the rejected optimum, and a live weight sandbox.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Methodology,
});

function normalise(raw: number[]) {
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((r) => r / sum);
}

function Sandbox() {
  const [raw, setRaw] = useState<number[]>(WEIGHTS.map((w) => w * 100));
  const weights = useMemo(() => normalise(raw), [raw]);

  const table = useMemo(
    () =>
      rankings
        .map((r) => ({ ...r, rating: computeRating(r.marks, weights) }))
        .sort((a, b) => b.rating - a.rating),
    [weights],
  );

  const moves = table
    .map((t, i) => ({ abbr: t.abbr, delta: t.rank - (i + 1) }))
    .filter((m) => m.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2);

  const drift = raw.reduce((s, v, i) => s + Math.abs(v / 100 - WEIGHTS[i]), 0);
  const verdict =
    drift < 0.08
      ? "Almost exactly ours. Suspicious."
      : raw[0] / (raw.reduce((a, b) => a + b, 0) || 1) > 0.6
        ? "That's Win% doing all the work."
        : "Bolder than ours.";

  return (
    <section className="surface-cream-2 mt-10 rounded-2xl border-2 border-ink p-5">
      <h2 className="font-display text-[24px]">The weight sandbox</h2>
      <p className="ink-muted mt-1 text-[14px]">
        Normalised to 100% — the real engine does the same.
      </p>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <ul className="flex flex-col gap-3">
          {SUBJECTS.map((s, i) => (
            <li key={s}>
              <label className="flex items-baseline justify-between text-[13px] font-medium">
                <span>{s}</span>
                <span className="tnum font-bold">{(weights[i] * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={60}
                step={1}
                value={raw[i]}
                aria-valuetext={`${(weights[i] * 100).toFixed(0)} percent`}
                onChange={(e) => {
                  const next = [...raw];
                  next[i] = Number(e.target.value);
                  setRaw(next);
                }}
                className="mt-1 h-11 w-full accent-purple"
              />
            </li>
          ))}
        </ul>

        <div>
          <ul className="surface-cream overflow-hidden rounded-xl border-2 border-ink" aria-live="polite">
            {table.map((t, i) => (
              <motion.li
                layout
                key={t.abbr}
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
                className="flex items-center gap-3 border-b-2 border-line px-3 py-2 last:border-b-0"
              >
                <span className="font-display text-[22px]" style={{ color: teamOf(t.abbr).color }}>
                  {i + 1}
                </span>
                <TeamLogo abbr={t.abbr} size={26} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{teamOf(t.abbr).name}</span>
                <span className="tnum text-[14px] font-bold">{t.rating.toFixed(1)}</span>
              </motion.li>
            ))}
          </ul>

          <p className="mt-3 text-[14px] font-semibold">
            {moves.length
              ? `Your weights move ${moves
                  .map((m) => `${teamOf(m.abbr).short} ${m.delta > 0 ? "up" : "down"} ${Math.abs(m.delta)}`)
                  .join(" and ")}.`
              : "Your weights produce our table, exactly."}
          </p>
          <p className="ink-muted mt-1 text-[14px]">{verdict}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="h-11" onClick={() => setRaw(WEIGHTS.map((w) => w * 100))}>
              Reset to ours
            </Button>
            <Button
              variant="ghost"
              className="h-11 text-ink"
              onClick={() => {
                void navigator.clipboard?.writeText(weights.map((w) => w.toFixed(3)).join(", "));
                toast.success("Link copied.");
              }}
            >
              Copy my weights
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="h-11 text-ink"
              onClick={() => setRaw([100, 0, 0, 0, 0, 0, 0, 0, 0])}
            >
              Only results matter
            </Button>
            <Button
              variant="ghost"
              className="h-11 text-ink"
              onClick={() => setRaw([5, 38, 37, 5, 5, 5, 3, 1, 1])}
            >
              The rejected optimum
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkedExample() {
  const [abbr, setAbbr] = useState("BR");
  const r = rankings.find((x) => x.abbr === abbr)!;
  let running = 0;

  return (
    <section className="mt-10">
      <h2 className="font-display text-[24px]">Worked example</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {rankings.map((x) => (
          <button
            key={x.abbr}
            type="button"
            onClick={() => setAbbr(x.abbr)}
            className={`h-11 rounded-lg border-2 px-3 text-[13px] font-bold ${
              abbr === x.abbr ? "border-ink bg-purple text-cream" : "border-ink/20"
            }`}
          >
            {x.abbr}
          </button>
        ))}
      </div>
      <div className="surface-cream-2 sticky top-[66px] z-10 mt-4 flex items-center justify-between rounded-xl border-2 border-ink px-3 py-2">
        <span className="text-[14px] font-semibold">{teamOf(abbr).name}</span>
        <span className="tnum font-display text-[20px]">{computeRating(r.marks).toFixed(2)}</span>
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {SUBJECTS.map((s, i) => {
          running += r.marks[i] * WEIGHTS[i];
          return (
            <motion.li
              key={s}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-3 border-b border-line py-1.5 text-[13px]"
            >
              <span className="truncate">{s}</span>
              <span className="tnum ink-muted">
                {r.marks[i]} × {WEIGHTS[i].toFixed(2)}
              </span>
              <span className="tnum w-[64px] text-right font-bold">{running.toFixed(2)}</span>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}

function Methodology() {
  const [email, setEmail] = useState("");

  return (
    <div className="surface-cream min-h-screen">
      <header className="surface-indigo sticky top-0 z-40 flex h-[66px] items-center justify-between px-5">
        <Link to="/" className="font-display text-[18px] text-cream">
          Champhunt <span className="t-micro">× Willow TV</span>
        </Link>
        <Link to="/" className="text-[14px] font-semibold text-gold">
          ← Back to the rankings
        </Link>
      </header>

      <main className="mx-auto max-w-[720px] px-5 py-12">
        <h1 className="t-h1">How the table is built</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <p className="surface-cream-2 rounded-xl border-2 border-ink p-4 text-[14px]">
            The league table asks: who has earned the most points?
          </p>
          <p className="surface-cream-2 rounded-xl border-2 border-ink p-4 text-[14px]">
            This asks: who is playing the best cricket right now?
          </p>
        </div>
        <p className="ink-muted mt-3 text-[14px]">
          Which is why a team can sit fourth in the table and top this list.
        </p>

        <blockquote className="mt-8 rounded-xl border-l-4 border-purple bg-cream-2 p-4 text-[15px]">
          The maths decides the order. The AI does not. Every position is computed by fixed formulas from match
          data. The model only writes the sentence explaining a position — it never sees, chooses, or influences
          the rank. A human checks every sentence before it publishes.
        </blockquote>

        <div className="mt-4 flex flex-col gap-2 text-[13px]">
          <span className="flex flex-wrap items-center gap-2">
            match data → nine metrics → weighted sum → sort
          </span>
          <span aria-hidden="true" className="ink-muted border-t-2 border-dashed border-purple pt-2">
            never crosses
          </span>
          <span className="flex flex-wrap items-center gap-2">→ blurb → human review → publish</span>
        </div>

        <Sandbox />

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { big: "0.69 → 0.76", line: "Held-out Spearman correlation after fitting on 300 simulated seasons." },
            { big: "Rejected", line: "The 0.892 optimum put ~75% onto the two phase metrics and Win% to 0.05." },
            { big: "2 of 9", line: "Win quality r ≈ +0.01. Strength of schedule r = −1.00 in a round-robin." },
          ].map((c) => (
            <div key={c.big} className="surface-cream-2 rounded-xl border-2 border-ink p-4">
              <p className="font-display text-[22px]">{c.big}</p>
              <p className="ink-muted mt-1 text-[13px]">{c.line}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-[24px]">Correct #1</h2>
          <p className="ink-muted mt-2 text-[14px]">
            The fit moved correct top-team calls from <DigitRoll value={46} suffix="%" /> to{" "}
            <DigitRoll value={50} suffix="%" />. Ratings sit in a typical band of 30–70; nobody reaches 100.
          </p>
        </section>

        <WorkedExample />

        <section className="mt-10 flex flex-col gap-3">
          <h2 className="font-display text-[24px]">The small print</h2>
          <Reveal label="Full formulas">
            Momentum: α = 0.35, seeded 0.5, half-life ≈1.6 matches. Five further metrics exist — expected wins,
            toss independence, chase versatility, top-four consistency, bowling spread. All are off by default.
          </Reveal>
          <Reveal label="What this doesn't do yet">
            Weights fitted on simulated seasons with a live re-fit underway. NRR divided by overs faced, not the
            full quota. Squad availability entered from team reports. Rain-shortened matches not modelled.
          </Reveal>
          <p className="ink-muted text-[13px]">
            Every match metric is computed from per-innings data. Squad availability is entered from team reports.
          </p>
        </section>

        <section className="surface-cream-2 mt-10 rounded-2xl border-2 border-ink p-5">
          <h2 className="font-display text-[22px]">Get the table every Monday.</h2>
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setEmail("");
              toast.success("You're on the list.");
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              className="h-12 flex-1 rounded-xl border-2 border-ink/20 bg-cream px-3 text-[15px] text-ink"
            />
            <Button type="submit">Send it to me</Button>
          </form>
        </section>

        <p className="mt-10">
          <Link to="/" className="text-[15px] font-semibold text-purple underline">
            ← Back to the rankings
          </Link>
        </p>
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
