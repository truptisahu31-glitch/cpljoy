import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Coins, Gift, Target } from "lucide-react";
import { Button, DigitRoll, Reveal, RunsIcon, SectionHeader, SmartImage } from "../champ/primitives";
import { deals } from "@/content/site.config";
import { useRuns } from "@/lib/runs";

const ACCENT = "var(--color-gold)";

const steps = [
  { icon: Target, label: "Predict", line: "Answer the questions you've got an opinion on." },
  { icon: Coins, label: "Win Runs", line: "Right calls pay. Wrong ones don't." },
  { icon: Gift, label: "Redeem", line: "Spend them on real things from real brands." },
];

export function EarnSpend() {
  const { balance, credit, spend, openAuth, track } = useRuns();
  const [redeemed, setRedeemed] = useState<string[]>([]);

  const touch = () => credit("deal-touch");

  return (
    <section id="deals" className="surface-cream-2 relative scroll-mt-[56px] overflow-hidden md:scroll-mt-[66px]">
      <div aria-hidden="true" className="tex-perf absolute inset-0 z-0 text-gold" />

      <div className="relative z-[2] mx-auto max-w-[1320px] px-[clamp(20px,5vw,64px)] py-[clamp(32px,5vw,64px)]">
        <SectionHeader title="Earn. Spend." sub="Be right, get Runs. Spend them on things you want." accent={ACCENT} />

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.label} className="relative">
              <Reveal label={s.label} className="w-full">
                {s.line}
              </Reveal>
              <div className="surface-cream mt-2 flex h-[96px] items-center gap-3 rounded-xl border-2 border-ink px-4">
                <s.icon size={22} aria-hidden="true" style={{ color: "var(--color-purple)" }} />
                <span className="font-display text-[18px]">{s.label}</span>
                {i < 2 && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                    className="ml-auto hidden h-[3px] w-8 origin-left rounded-full bg-gold sm:block"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>

        <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {deals.map((d) => {
            const affordable = balance >= d.cost;
            const done = redeemed.includes(d.id);
            return (
              <li
                key={d.id}
                className="surface-cream group w-[82vw] shrink-0 snap-center overflow-hidden rounded-2xl border-2 border-ink sm:w-[62vw] lg:w-auto"
              >
                <div className="relative h-[180px] overflow-hidden">
                  <SmartImage
                    src={d.image}
                    alt={d.alt}
                    width={1080}
                    height={720}
                    className="h-full w-full transition-transform duration-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.03]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-purple/35 mix-blend-multiply transition-opacity duration-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-0"
                  />
                </div>
                <div className="flex flex-col gap-2 p-3">
                  <span className="t-micro ink-muted">{d.cat}</span>
                  <span className="text-[15px] font-semibold leading-snug">{d.offer}</span>
                  <span className="flex items-center gap-1.5 text-[14px] font-bold">
                    <RunsIcon size={15} className={done || affordable ? "" : "opacity-40"} />
                    <span className={done || affordable ? "" : "line-through opacity-60"}>
                      <DigitRoll value={d.cost} />
                    </span>
                  </span>
                  <div onClickCapture={touch} onMouseEnter={touch}>
                    <Reveal label="Terms">{d.terms}</Reveal>
                  </div>
                  {done ? (
                    <Button variant="ghost" full disabled className="text-ink">
                      Redeemed
                    </Button>
                  ) : affordable ? (
                    <Button
                      full
                      onClick={() => {
                        touch();
                        spend(d.cost);
                        setRedeemed((r) => [...r, d.id]);
                        toast.success("Nice. Check your email for the code.");
                        track("redeem_attempted", { deal: d.id, state: "affordable" });
                        openAuth("deals");
                      }}
                    >
                      Redeem
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      full
                      onClick={() => {
                        touch();
                        track("redeem_attempted", { deal: d.id, state: "locked" });
                        document.getElementById("call-it")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Earn {d.cost - balance} more
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex justify-center">
          <Button className="w-full sm:w-auto" onClick={() => openAuth("deals")}>
            Claim your Runs
          </Button>
        </div>
      </div>
    </section>
  );
}
