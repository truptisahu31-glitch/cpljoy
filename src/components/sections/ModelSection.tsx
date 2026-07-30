import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { MessageCircle, Newspaper, Tag, Trophy } from "lucide-react";
import { Button, DigitRoll, RunsIcon, SectionHeader, SmartImage } from "../champ/primitives";
import { crowdFrames } from "@/content/site.config";
import { useReducedMotion } from "@/lib/media";
import { useRuns } from "@/lib/runs";

const ACCENT = "var(--color-magenta)";

const tiles = [
  { icon: Newspaper, label: "Pitch", line: "The feed. Where the arguments happen." },
  { icon: MessageCircle, label: "Dugout", line: "Live match chat. Loud, occasionally unhinged." },
  { icon: Trophy, label: "Arena", line: "Predictions, challenges, fantasy." },
  { icon: Tag, label: "Deals", line: "What your Runs are worth." },
];

function PhoneScreen({ tab, playing }: { tab: number; playing: boolean }) {
  const reduced = useReducedMotion();
  const animate = playing && !reduced;

  if (tab === 0) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {["Pooran again. Third time this week.", "That death bowling was criminal.", "Barbados have a spin problem."].map(
          (t, i) => (
            <motion.div
              key={t}
              initial={{ y: 18, opacity: 0 }}
              animate={animate ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.35, repeat: animate ? Infinity : 0, repeatDelay: 2.4 }}
              className="surface-cream rounded-lg border-2 border-line p-2"
            >
              <p className="text-[11px] font-semibold">{t}</p>
              <p className="ink-muted mt-1 text-[10px]">♥ {124 + i * 7} · 12 replies</p>
            </motion.div>
          ),
        )}
      </div>
    );
  }
  if (tab === 1) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[
          { side: "l", t: "Bring back the spinner" },
          { side: "r", t: "Six. Called it." },
          { side: "l", t: "Field's all wrong" },
          { side: "r", t: "17 needed, 12 balls" },
        ].map((m, i) => (
          <motion.p
            key={m.t}
            initial={{ x: m.side === "l" ? -20 : 20, opacity: 0 }}
            animate={animate ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.3, repeat: animate ? Infinity : 0, repeatDelay: 2.2 }}
            className={`max-w-[78%] rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ${
              m.side === "l" ? "surface-cream self-start border-2 border-line" : "self-end bg-purple text-cream"
            }`}
          >
            {m.t}
          </motion.p>
        ))}
      </div>
    );
  }
  if (tab === 2) {
    return (
      <div className="grid h-full place-items-center p-4">
        <motion.div
          animate={animate ? { rotateY: [0, 0, 180, 180] } : {}}
          transition={{ duration: 3.4, repeat: animate ? Infinity : 0, times: [0, 0.4, 0.6, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="surface-cream w-full rounded-xl border-2 border-ink p-3"
        >
          <p className="text-[11px] font-bold">Who wins tonight?</p>
          <div className="mt-2 flex gap-2">
            <span className="flex-1 rounded-lg border-2 border-magenta bg-magenta/15 py-2 text-center text-[11px] font-bold">TKR</span>
            <span className="flex-1 rounded-lg border-2 border-line py-2 text-center text-[11px] font-bold">GAW</span>
          </div>
          <p className="ink-muted mt-2 text-[10px]">58% of fans are with you.</p>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold">
        <RunsIcon size={13} />
        <motion.span
          animate={animate ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1.6, repeat: animate ? Infinity : 0 }}
        >
          1,700 Runs
        </motion.span>
      </p>
      {["One-match live pass", "$15 off match-day food", "20% off cricket gear"].map((d, i) => (
        <motion.div
          key={d}
          initial={{ x: 24, opacity: 0 }}
          animate={animate ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: i * 0.3, repeat: animate ? Infinity : 0, repeatDelay: 2.2 }}
          className="surface-cream flex items-center justify-between rounded-lg border-2 border-line px-2 py-1.5"
        >
          <span className="text-[11px] font-semibold">{d}</span>
          <span className="rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-ink">Redeem</span>
        </motion.div>
      ))}
    </div>
  );
}

export function ModelSection() {
  const { track } = useRuns();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const [tab, setTab] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView || reduced) return;
    const t = window.setInterval(() => setTab((v) => (v + 1) % 4), 3600);
    return () => window.clearInterval(t);
  }, [inView, reduced]);

  return (
    <section id="model" className="surface-cream-2 relative scroll-mt-[56px] overflow-hidden md:scroll-mt-[66px]">
      <div aria-hidden="true" className="tex-matrix absolute inset-0 z-0 text-magenta" />
      <div aria-hidden="true" className="absolute inset-0 z-[1]">
        <SmartImage src={crowdFrames[2].src} alt="" width={1920} height={1088} className="h-full w-full opacity-[0.22]" />
        <span className="absolute inset-0 bg-gradient-to-r from-cream-2 via-cream-2/70 to-cream-2" />
      </div>

      <div ref={ref} className="relative z-[2] mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(32px,5vw,64px)]">
        <SectionHeader title="We built the model" sub="We also built a very loud cricket app." accent={ACCENT} />

        <div className="mt-8 grid items-center gap-8 md:grid-cols-[280px_minmax(0,1fr)_minmax(0,0.9fr)]">
          {/* phone mockup: no notch, no hardware buttons, no shadow stack */}
          <div className="mx-auto w-[248px]">
            <div className="surface-cream-3 overflow-hidden rounded-[26px] border-4 border-ink p-2">
              <div className="surface-cream-2 h-[420px] overflow-hidden rounded-[18px]">
                <div className="surface-purple flex items-center justify-between px-3 py-2">
                  <span className="t-micro">{tiles[tab].label}</span>
                  <span className="t-micro flex items-center gap-1">
                    <RunsIcon size={12} />
                    <DigitRoll value={1700} />
                  </span>
                </div>
                <PhoneScreen tab={tab} playing={inView} />
              </div>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3">
            {tiles.map((t, i) => (
              <li key={t.label}>
                <button
                  type="button"
                  onClick={() => {
                    setTab(i);
                    track("model_tile", { tile: t.label });
                  }}
                  className={`surface-cream flex h-[96px] w-full flex-col justify-center gap-1 rounded-xl border-2 px-3 text-left transition-transform hover:-translate-y-[2px] ${
                    tab === i ? "border-magenta" : "border-ink/20"
                  }`}
                >
                  <t.icon size={20} aria-hidden="true" style={{ color: "var(--color-magenta)" }} />
                  <span className="text-[15px] font-semibold leading-none">{t.label}</span>
                  <span className="ink-muted truncate text-[13px]">{t.line}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-2">
            {crowdFrames.map((f) => (
              <SmartImage
                key={f.alt}
                src={f.src}
                alt={f.alt}
                width={1280}
                height={640}
                className="aspect-[4/3] rounded-xl border-2 border-ink"
              />
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              track("model_cta");
              document.getElementById("call-it")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Start with a prediction
          </Button>
        </div>
      </div>

      {/* crowd marquee */}
      <div className="relative z-[2] border-y-2 border-ink bg-cream-3">
        <div className="group h-[100px] overflow-hidden md:h-[140px]">
          <div className="flex h-full w-max animate-marquee gap-2 [@media(hover:hover)_and_(pointer:fine)]:group-hover:[animation-play-state:paused]">
            {[...crowdFrames, ...crowdFrames, ...crowdFrames, ...crowdFrames].map((f, i) => (
              <SmartImage
                key={i}
                src={f.src}
                alt=""
                width={1280}
                height={640}
                className="h-full w-[170px] shrink-0 md:w-[240px]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
