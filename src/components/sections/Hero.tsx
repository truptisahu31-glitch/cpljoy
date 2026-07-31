import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button, DigitRoll, PlayerImage, SmartImage } from "../champ/primitives";
import { rankings, site, teamOf } from "@/content/site.config";
import { useSiteImages } from "@/lib/site-images";
import { computeRating } from "@/lib/rating";
import { useReducedMotion } from "@/lib/media";
import { useRuns } from "@/lib/runs";

const chipBySource: Record<string, string> = {
  "willow-email": "Straight from the Willow newsletter",
  "cpl-web": "Seen on the CPL site",
  "willow-web": "Straight from Willow",
  "willow-tv": "Seen on Willow TV",
  direct: "AI power rankings · CPL 2026",
};

export function Hero() {
  const { heroSlides } = useSiteImages();
  const reduced = useReducedMotion();
  const { openAuth, track, source } = useRuns();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const top = rankings[0];
  const topTeam = teamOf(top.abbr);

  useEffect(() => {
    if (reduced || paused) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(t);
  }, [reduced, paused]);

  useEffect(() => {
    track("carousel_slide_changed", { index: i });
  }, [i, track]);

  const slide = heroSlides[i];

  return (
    <section
      id="top"
      className="surface-indigo relative flex min-h-[calc(100dvh-56px)] flex-col overflow-hidden scroll-mt-[56px] md:min-h-[calc(100dvh-66px)] md:scroll-mt-[66px]"
      aria-label="AI power rankings for CPL 2026"
    >
      {/* z-0 image layer */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: reduced ? 1 : 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.2 }, scale: { duration: 6, ease: "linear" } }}
            className="absolute inset-0"
          >
            <SmartImage
              src={slide.src}
              alt={slide.alt}
              width={1920}
              height={1088}
              eager={i === 0}
              className="h-full w-full"
              style={{ objectPosition: slide.focal }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* z-1 required scrim: bottom-up gradient + corner vignette */}
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-gradient-to-t from-indigo via-indigo/70 to-indigo/25" />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1]"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 40%, rgba(36,27,94,0.4) 100%)" }}
      />
      {/* two conical light beams at 6% */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] opacity-[0.06]"
        style={{
          background:
            "conic-gradient(from 200deg at 8% -10%, #FFF4E6 0 12deg, transparent 12deg), conic-gradient(from 120deg at 92% -10%, #FFF4E6 0 12deg, transparent 12deg)",
        }}
      />
      {/* The hero figure.
          Positioned against the section rather than its grid column, because
          the column cannot express the one constraint that matters: the figure
          has to sit between the header and the stat strip. Anchoring top and
          bottom to fixed insets means it is as large as that band allows at any
          viewport and can never be sliced by the strip, which paints its own
          background over whatever reaches it.

          `object-bottom` puts the boots on the box floor, so the clearance is
          exact; the head lands wherever the aspect ratio takes it.

          It sits ABOVE the stat strip in z-order. The strip paints its own
          background, so anything behind it is cut rather than overlapped — that
          is what was slicing the legs. Drawing the figure on top lets it stand
          in front of the strip and reach lower without losing its boots.

          No enter animation: this used to slide in from `opacity: 0`, and when
          that stalled the subject of the hero sat at a third of its opacity,
          washed into the background. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[3] hidden w-[52%] md:block">
        <div className="absolute bottom-[48px] right-[1%] top-[10px] w-full">
          <PlayerImage
            playerId="pooran"
            eager
            className="h-full w-full object-contain object-bottom"
          />
        </div>
      </div>

      {/* z-2 content */}
      <div className="relative z-[2] mx-auto grid w-full max-w-[1320px] flex-1 content-center gap-8 px-[clamp(20px,5vw,64px)] py-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-center md:py-10">
        <div className="min-w-0">
          <span className="t-micro inline-flex items-center gap-2 rounded-full border-2 border-gold px-3 py-1.5 text-cream">
            <span aria-hidden="true" className="h-2 w-2 animate-live rounded-full bg-live" />
            {chipBySource[source]}
          </span>

          <h1 className="mt-5 max-w-[18ch] text-cream" style={{ fontSize: "clamp(38px, 6vw, 88px)", lineHeight: 1.03 }}>
            {topTeam.name} are playing the best cricket in the Caribbean
          </h1>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => {
                track("hero_cta", { cta: "see_the_table" });
                document.getElementById("rankings")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto"
            >
              See the table
            </Button>
            <Button
              variant="ghost"
              className="w-full text-cream sm:w-auto"
              onClick={() => {
                track("hero_cta", { cta: "play_a_prediction" });
                document.getElementById("call-it")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Play a prediction
            </Button>
          </div>

        </div>

        <div className="relative hidden h-full min-h-[320px] md:block" />
      </div>

      {/* Frame control, at the foot of the full-screen hero. */}
      <div
        className="relative z-[3] flex items-center justify-center gap-3 pb-5 md:pb-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {heroSlides.map((s, idx) => (
          <button
            key={s.venue}
            type="button"
            aria-label={`Show ${s.venue}`}
            aria-current={idx === i}
            onClick={() => setI(idx)}
            className={`h-3 w-3 rounded-full border-2 border-cream transition-colors ${idx === i ? "bg-gold" : "bg-transparent"}`}
          />
        ))}
      </div>

      {/* stat strip */}
      <div className="relative z-[2] border-t-2 border-purple bg-indigo/85">
        <ul className="mx-auto grid max-w-[1320px] grid-cols-2 gap-px px-[clamp(20px,5vw,64px)] py-4 md:grid-cols-4 md:py-0">
          {[
            { n: site.tournament.teams, label: "teams" },
            { n: site.tournament.matches, label: "matches" },
            { n: site.tournament.rankings, label: "weekly rankings" },
            { n: site.tournament.measurements, label: "measurements" },
          ].map((s) => (
            <li key={s.label} className="flex min-h-[70px] flex-col justify-center gap-1 py-3 md:h-[80px] md:flex-row md:items-center md:gap-3">
              <span className="font-display text-[28px] leading-none text-gold md:text-[32px]">
                <DigitRoll value={s.n} />
              </span>
              <span className="t-micro cream-muted">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="sr-only">
        Top rating this week: {computeRating(top.marks).toFixed(1)} for {topTeam.name}.
      </p>
      <button className="sr-only" onClick={() => openAuth("header")}>
        Sign up
      </button>
    </section>
  );
}
