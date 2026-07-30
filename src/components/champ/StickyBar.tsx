import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button, DigitRoll, RunsIcon } from "./primitives";
import { useRuns } from "@/lib/runs";

export function StickyBar() {
  const { balance, openAuth } = useRuns();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const final = document.getElementById("final");
    const hero = document.getElementById("top");
    const onScroll = () => {
      const pastHero = hero ? hero.getBoundingClientRect().bottom < 80 : false;
      const finalVisible = final ? final.getBoundingClientRect().top < window.innerHeight * 0.9 : false;
      setShow(pastHero && !finalVisible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="surface-indigo fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t-2 border-purple px-4 py-3 md:hidden"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
        >
          <span className="flex items-center gap-2 text-[14px] font-semibold text-cream">
            <RunsIcon size={16} />
            <DigitRoll value={balance} /> Runs
          </span>
          {balance === 0 ? (
            <Button
              variant="gold"
              className="h-11 px-4 text-[14px]"
              onClick={() => document.getElementById("call-it")?.scrollIntoView({ behavior: "smooth" })}
            >
              Play a prediction
            </Button>
          ) : (
            <Button variant="gold" className="h-11 px-4 text-[14px]" onClick={() => openAuth("final")}>
              Keep my Runs
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
