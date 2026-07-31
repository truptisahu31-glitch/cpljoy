import { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button, SectionHeader, SmartImage, TeamLogo } from "../champ/primitives";
import { prediction as bundled, teamOf } from "@/content/site.config";
import { predictionFrom } from "@/lib/editable-questions";
import { useSiteContent } from "@/lib/use-site-content";
import { useSiteImages } from "@/lib/site-images";
import { useRuns } from "@/lib/runs";

const ACCENT = "var(--color-coral)";

export function CallIt() {
  // Question text, answers and copy are editable from /admin; the fixture,
  // teams and timing stay with the bundled record.
  const content = useSiteContent();
  const edits = predictionFrom(content);
  const prediction = { ...bundled, ...edits };
  const { crowdFrames } = useSiteImages();
  const { credit, openAuth, track } = useRuns();
  const [picked, setPicked] = useState<string | null>(null);
  const closed = false; // driven by closes_at in the live build
  if (prediction.review_status !== "approved") return null;

  const layout =
    prediction.options.length === 4 ? "grid-cols-2" : prediction.options.length === 3 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";

  const pickedAbbr = picked === prediction.options[0].id ? prediction.team_abbrs[0] : prediction.team_abbrs[1];

  return (
    <section id="call-it" className="surface-cream relative scroll-mt-[56px] overflow-hidden md:scroll-mt-[66px]">
      <div aria-hidden="true" className="tex-chevron absolute inset-0 z-0 text-coral" />
      <div aria-hidden="true" className="absolute inset-0 z-[1]">
        <SmartImage src={crowdFrames[0].src} alt="" width={1280} height={640} className="h-full w-full opacity-[0.2]" />
        <span className="absolute inset-0 bg-gradient-to-r from-cream via-cream/55 to-cream" />
      </div>

      <div className="relative z-[2] mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(24px,3.4vw,44px)]">
        <SectionHeader title="Call it" sub="No account. No card. Just pick." accent={ACCENT} />

        <div className="mt-8 flex justify-center">
          <motion.div
            animate={{ rotateY: picked ? 180 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-full max-w-[560px]"
          >
            {/* front */}
            <div
              className="surface-cream-2 rounded-2xl border-2 border-ink p-5 shadow-[6px_6px_0_0_var(--color-coral)]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="font-display text-[19px]">{prediction.fixture_label}</p>
              <p className="ink-muted mt-1 text-[13px]">{prediction.meta}</p>
              <p className="mt-4 text-[15px] font-semibold">{prediction.question}</p>

              <div className={`mt-3 grid gap-3 ${layout}`}>
                {prediction.options.map((o, i) => {
                  const team = teamOf(prediction.team_abbrs[i]);
                  const isPicked = picked === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={closed}
                      onClick={() => {
                        if (picked) return;
                        setPicked(o.id);
                        credit("prediction");
                        track("prediction_answered", { pick: o.id });
                      }}
                      className={`relative flex min-h-[76px] items-center gap-3 overflow-hidden rounded-xl border-[3px] px-4 text-left transition-[transform,border-color,opacity] duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-[2px] ${
                        isPicked ? "" : picked ? "opacity-40" : ""
                      }`}
                      style={{
                        borderColor: isPicked ? team.color : "var(--color-ink)",
                        backgroundColor: isPicked ? `${team.color}2E` : "var(--color-cream)",
                        color: "var(--color-ink)",
                      }}
                    >
                      <TeamLogo abbr={team.abbr} size={32} />
                      <span className="text-[18px] font-semibold">{o.label}</span>
                      {isPicked && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          className="ml-auto grid h-7 w-7 place-items-center rounded-full"
                          style={{ backgroundColor: team.color, color: "var(--color-cream)" }}
                        >
                          <Check size={16} aria-hidden="true" />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="ink-muted mt-3 text-[12px]">{prediction.edge_case_rule}</p>
            </div>

            {/* back */}
            <div
              className="surface-cream-2 absolute inset-0 rounded-2xl border-2 border-ink p-5 shadow-[6px_6px_0_0_var(--color-coral)]"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <p className="font-display text-[19px]">{prediction.split}% of fans are with you.</p>
              <div className="mt-4 flex flex-col gap-2">
                {[
                  { label: pickedAbbr, pct: prediction.split, color: teamOf(pickedAbbr).color },
                  { label: "Everyone else", pct: 100 - prediction.split, color: "var(--color-ink)" },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex items-baseline justify-between text-[13px] font-semibold">
                      <span>{b.label}</span>
                      <span className="tnum">{b.pct}%</span>
                    </div>
                    <div className="mt-1 h-[12px] overflow-hidden rounded-full bg-ink/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: picked ? `${b.pct}%` : 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: b.color, minWidth: 14 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[15px] font-semibold">{prediction.hook}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" onClick={() => openAuth("prediction")}>
                  Keep my pick
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-ink sm:w-auto"
                  onClick={() => document.getElementById("back-yourself")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Put Runs on it
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
