import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, DigitRoll, Reveal, SectionHeader } from "../champ/primitives";
import { DECAY_SERIES, SUBJECTS, WEIGHTS } from "@/lib/rating";
import { useRuns } from "@/lib/runs";

const ACCENT = "var(--color-brand)";

function Weights() {
  return (
    <div>
      <h3 className="font-display text-[19px]">The nine subjects</h3>
      <ul className="mt-4 flex flex-col gap-2.5">
        {SUBJECTS.map((s, i) => (
          <li key={s} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[13px] font-medium">
                <span className="truncate">{s}</span>
                {i >= 7 && (
                  <Reveal label="Flag" align="right">
                    We measured this one. It didn't work.
                  </Reveal>
                )}
              </span>
              <span className="mt-1 block h-[10px] w-full overflow-hidden rounded-full bg-ink/10">
                <motion.span
                  className="block h-full rounded-full bg-purple"
                  style={{ minWidth: 14 }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${WEIGHTS[i] * 100 * 3}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                />
              </span>
            </span>
            <span className="tnum w-[46px] text-right text-[13px] font-bold">
              {(WEIGHTS[i] * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
      <p className="ink-muted mt-3 flex items-center gap-1.5 text-[12px]">
        <AlertTriangle size={13} aria-hidden="true" /> Two subjects carry a warning.
      </p>
    </div>
  );
}

function Decay() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const pts = Array.from({ length: 8 }, (_, i) => {
    const v = 0.35 * Math.pow(0.65, i);
    return { x: 20 + i * 42, y: 110 - v * 260 };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  return (
    <div>
      <h3 className="font-display text-[19px]">Why momentum fades</h3>
      <svg ref={ref} viewBox="0 0 340 150" className="mt-4 w-full" role="img" aria-label="Momentum weight falls from 0.350 for the most recent match to 0.063 five matches back.">
        <line x1="16" y1="120" x2="330" y2="120" stroke="var(--color-line)" strokeWidth="2" />
        {DECAY_SERIES.map((v, i) => (
          <motion.rect
            key={i}
            x={20 + i * 42 - 9}
            width="18"
            rx="3"
            fill="var(--color-gold)"
            initial={{ height: 0, y: 120 }}
            animate={inView ? { height: v * 260, y: 120 - v * 260 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}
        <motion.path
          d={path}
          fill="none"
          stroke="var(--color-purple)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <text x="150" y="142" fontSize="11" fill="var(--color-ink)" opacity="0.62">
          matches ago 1 – 8
        </text>
        <text x="196" y="36" fontSize="11" fill="var(--color-ink)" opacity="0.62">
          half-life ≈ 1.6 matches
        </text>
      </svg>
      <p className="ink-muted mt-2 text-[13px]">Most recent match ≈35%. Last five together ≈88%.</p>
    </div>
  );
}

function Accuracy() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <div ref={ref}>
      <h3 className="font-display text-[19px]">Accuracy</h3>
      <div className="mt-4 flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="h-[120px] w-[120px]" aria-hidden="true">
          <circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-ink)" strokeOpacity="0.12" strokeWidth="12" />
          <motion.circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="var(--color-purple)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 48}
            initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
            animate={inView ? { strokeDashoffset: 2 * Math.PI * 48 * (1 - 0.76) } : {}}
            transition={{ duration: 1.1, ease: "easeOut" }}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div>
          <p className="font-display text-[38px] leading-none">
            <DigitRoll value={0.76} decimals={2} />
          </p>
          <p className="ink-muted mt-1 text-[13px]">correlation with true strength</p>
          <p className="ink-muted mt-2 text-[13px]">
            <DigitRoll value={0.69} decimals={2} /> → <DigitRoll value={0.76} decimals={2} />
          </p>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const { track } = useRuns();
  return (
    <section id="how-it-works" className="surface-cream relative scroll-mt-[56px] md:scroll-mt-[66px]">
      <div className="mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(24px,3.4vw,44px)]">
        <SectionHeader
          title="How it works"
          sub="Nine measurements, weights we tested, two we admit don't work yet."
          accent={ACCENT}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <Weights />
          <Decay />
          <Accuracy />
        </div>

        <p className="mt-8 text-[15px] font-semibold">We measured these. We didn't pick them.</p>

        <div className="mt-6 flex justify-center">
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              track("methodology_link", { from: "how_it_works" });
              window.location.href = "/methodology";
            }}
          >
            Read the full method
          </Button>
        </div>
      </div>
    </section>
  );
}
