import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { MessageCircle, Newspaper, Tag, Trophy } from "lucide-react";
import { Button, DigitRoll, RunsIcon, SectionHeader, SmartImage } from "../champ/primitives";
import { imageOr } from "@/lib/site-content";
import { useSiteContent } from "@/lib/use-site-content";
import { useReducedMotion } from "@/lib/media";
import { useRuns } from "@/lib/runs";
import { useSiteImages } from "@/lib/site-images";

const ACCENT = "var(--color-magenta)";

/** `id` doubles as the admin label for the `appMockup` slot, and `shot` is the
 *  bundled screen that ships with the site — replaceable per tab from /admin. */
const tiles = [
  { id: "pitch", icon: Newspaper, label: "Pitch", line: "The feed. Where the arguments happen.", shot: "/mockups/pitch.png" },
  { id: "dugout", icon: MessageCircle, label: "Dugout", line: "Live match chat. Loud, occasionally unhinged.", shot: "/mockups/dugout.png" },
  { id: "arena", icon: Trophy, label: "Arena", line: "Predictions, challenges, fantasy.", shot: "/mockups/arena.png" },
  { id: "deals", icon: Tag, label: "Deals", line: "What your Runs are worth.", shot: "/mockups/deals.png" },
];

/**
 * One app screen.
 *
 * The mockup PNGs carry their own device bezel, so nothing is drawn around
 * them — the hand-built phone frame that used to wrap this produced a phone
 * inside a phone. `contain`, not `cover`, for the same reason: cropping would
 * slice the device edges off.
 */
function PhoneScreen({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={1419}
      height={2796}
      className="h-full w-full object-contain"
      decoding="async"
    />
  );
}

/**
 * Cursor parallax on the device.
 *
 * The tilt is written to `phone.style.transform` rather than through state, so
 * a pointer move never re-renders the section, and it eases toward the target
 * so the device glides instead of snapping. Skipped entirely for coarse
 * pointers and for anyone who asked for reduced motion.
 */
function usePhoneTilt(
  stageRef: React.RefObject<HTMLElement | null>,
  phoneRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const stage = stageRef.current;
    const phone = phoneRef.current;
    if (!stage || !phone) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const apply = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      phone.style.transform =
        `perspective(900px) rotateY(${cx.toFixed(2)}deg) rotateX(${(-cy).toFixed(2)}deg)`;
      raf =
        Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01
          ? requestAnimationFrame(apply)
          : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      // -1..1 across the section, scaled to a gentle tilt.
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * 10;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2 * 8;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [stageRef, phoneRef]);
}

export function ModelSection() {
  const { crowdFrames } = useSiteImages();
  const { track } = useRuns();
  const content = useSiteContent();

  /** Admin-uploaded screen for a tab, else the bundled one. */
  const shotFor = (t: (typeof tiles)[number]) => imageOr(content, "appMockup", t.shot, t.id);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const [tab, setTab] = useState(0);
  const reduced = useReducedMotion();
  const phoneRef = useRef<HTMLDivElement>(null);
  usePhoneTilt(ref, phoneRef);

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

      <div ref={ref} className="relative z-[2] mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(24px,3.4vw,44px)]">
        <SectionHeader title="We built the model" sub="We also built a very loud cricket app." accent={ACCENT} />

        <div className="mt-8 grid items-center gap-8 md:grid-cols-[300px_minmax(0,1fr)]">
          {/* No enter animation around the screen.
              It used to be an AnimatePresence + motion.div fading in from
              opacity 0. Under SSR that animation never started, so the wrapper
              stayed at opacity 0 — and because the image is lazy, an invisible
              image is also never fetched. The screen is the point of this
              section; it does not wait on anything. */}
          <div
            ref={phoneRef}
            className="mx-auto w-[248px] will-change-transform md:w-[280px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="aspect-[1419/2796] w-full">
              <PhoneScreen
                src={shotFor(tiles[tab])}
                alt={`${tiles[tab].label} screen in the Champhunt app`}
              />
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-4">
            {tiles.map((t, i) => (
              <li key={t.label}>
                <button
                  type="button"
                  onClick={() => {
                    setTab(i);
                    track("model_tile", { tile: t.label });
                  }}
                  className={`surface-cream flex h-[132px] w-full flex-col justify-center gap-2 rounded-xl border-2 px-5 text-left transition-transform hover:-translate-y-[2px] md:h-[190px] ${
                    tab === i ? "border-magenta" : "border-ink/20"
                  }`}
                >
                  <t.icon size={28} aria-hidden="true" style={{ color: "var(--color-magenta)" }} />
                  <span className="font-display text-[19px] leading-none md:text-[24px]">{t.label}</span>
                  <span className="ink-muted text-[13px] md:text-[15px]">{t.line}</span>
                </button>
              </li>
            ))}
          </ul>
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
