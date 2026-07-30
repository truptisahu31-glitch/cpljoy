import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Button, DigitRoll, RunsIcon } from "./primitives";
import { nav } from "@/content/site.config";
import { useRuns } from "@/lib/runs";

function Lockup({ compact }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gold font-display text-[13px] leading-none text-ink"
        aria-hidden="true"
      >
        C
      </span>
      <div className="min-w-0 leading-tight">
        <span className="block truncate font-display text-[15px] text-cream sm:text-[17px]">Champhunt</span>
        {!compact && (
          <span className="t-micro cream-muted hidden truncate text-[9px] sm:block">Powered by Champhunt AI</span>
        )}
      </div>

      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-cream/30" />
      <span className="t-micro shrink-0 text-[10px] text-cream">×</span>
      <span className="t-micro shrink-0 whitespace-nowrap text-[10px] text-cream sm:text-[11px]">Willow TV</span>
    </div>
  );
}

function RunsCounter() {
  const { balance, lastCredit } = useRuns();
  return (
    <div className="relative flex items-center gap-2 rounded-xl border-2 border-cream/25 px-2.5 py-1.5">
      <RunsIcon size={16} />
      <span className="tnum font-display text-[15px] leading-none text-cream" aria-live="polite">
        <DigitRoll value={balance} />
      </span>
      <span className="t-micro cream-muted hidden text-[10px] sm:inline">Runs</span>
      <span className="t-micro rounded bg-gold px-1.5 py-0.5 text-[9px] text-ink">Demo</span>
      <AnimatePresence>
        {lastCredit && (
          <motion.span
            key={lastCredit.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: -18 }}
            exit={{ opacity: 0, y: -26 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap font-display text-[13px] text-gold"
          >
            +{lastCredit.amount}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const { openAuth, signedIn, balance, track } = useRuns();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="surface-indigo fixed inset-x-0 top-0 z-50 h-[56px] border-b-2 border-purple md:h-[66px]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gold/25">
        <div className="h-full bg-gold transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto grid h-full max-w-[1320px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 md:grid-cols-[auto_1fr_auto] md:px-6">
        <Lockup />

        <nav className="hidden items-center justify-center gap-5 md:flex">
          <span className="t-micro flex items-center gap-2 rounded-full border-2 border-gold px-2.5 py-1 text-cream">
            <span aria-hidden="true" className="h-2 w-2 animate-live rounded-full bg-live" />
            CPL 2026
          </span>
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-[14px] font-semibold text-cream transition-colors hover:text-gold"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden md:block">
            <RunsCounter />
          </div>
          {signedIn ? (
            <span className="flex items-center gap-2 rounded-xl border-2 border-gold px-2 py-1 text-[13px] font-semibold text-cream">
              <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-gold font-display text-ink">
                A
              </span>
              <span className="tnum hidden sm:inline">
                <DigitRoll value={balance} />
              </span>
            </span>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hidden h-9 px-3 text-[13px] text-cream md:inline-flex md:h-9"
                onClick={() => openAuth("header")}
              >
                Log in
              </Button>
              <Button
                className="hidden h-9 px-4 text-[13px] md:inline-flex md:h-9"
                onClick={() => openAuth("header")}
              >
                Sign up
              </Button>
            </>
          )}
          <div className="md:hidden">
            <RunsCounter />
          </div>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => {
              setOpen((o) => !o);
              track("nav_sheet_toggled");
            }}
            className="grid h-11 w-11 place-items-center rounded-xl border-2 border-cream/30 text-cream md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="surface-indigo fixed inset-x-0 top-[56px] bottom-0 z-50 flex flex-col gap-6 overflow-y-auto px-5 py-8 md:hidden"
          >
            <span className="t-micro flex w-fit items-center gap-2 rounded-full border-2 border-gold px-3 py-1">
              <span aria-hidden="true" className="h-2 w-2 animate-live rounded-full bg-live" />
              CPL 2026
            </span>
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="font-display text-[30px] text-cream"
              >
                {n.label}
              </a>
            ))}
            <a href="/methodology" onClick={() => setOpen(false)} className="font-display text-[30px] text-cream">
              Method
            </a>
            <div className="mt-auto flex flex-col gap-3">
              <Button
                variant="ghost"
                full
                className="text-cream"
                onClick={() => {
                  setOpen(false);
                  openAuth("header");
                }}
              >
                Log in
              </Button>
              <Button
                full
                onClick={() => {
                  setOpen(false);
                  openAuth("header");
                }}
              >
                Sign up
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
