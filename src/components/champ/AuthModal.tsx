import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "./primitives";
import { useRuns, type AuthTrigger } from "@/lib/runs";

const headlines: Record<AuthTrigger, (n: number) => string> = {
  header: () => "Join Champhunt",
  prediction: () => "Keep your pick",
  challenge: () => "Keep your 150 Runs",
  deals: () => "Spend your Runs",
  final: (n) => `Keep your ${n} Runs`,
};

export function AuthModal() {
  const { authOpen, authTrigger, closeAuth, signIn, balance } = useRuns();
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const panel = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth();
      if (e.key === "Tab" && panel.current) {
        const nodes = panel.current.querySelectorAll<HTMLElement>(
          'button,input,a[href],[tabindex]:not([tabindex="-1"])',
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [authOpen, closeAuth]);

  return (
    <AnimatePresence>
      {authOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={closeAuth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo/70"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={headlines[authTrigger](balance)}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="surface-cream relative w-full max-w-[420px] rounded-t-2xl border-2 border-ink p-6 shadow-[8px_8px_0_0_var(--color-purple)] sm:rounded-2xl"
          >
            <button
              type="button"
              onClick={closeAuth}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg border-2 border-ink/20 text-ink hover:border-ink"
            >
              <X size={16} />
            </button>

            <h2 className="t-h2 pr-10 text-[26px]">{headlines[authTrigger](balance)}</h2>

            <div className="mt-4 flex gap-1 rounded-xl border-2 border-ink/15 p-1">
              {(["signup", "login"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`h-10 flex-1 rounded-lg text-[14px] font-semibold transition-colors ${
                    tab === t ? "bg-brand text-cream" : "text-ink hover:bg-cream-3"
                  }`}
                >
                  {t === "signup" ? "Sign up" : "Log in"}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button variant="outline" full onClick={signIn}>
                Continue with Google
              </Button>
              <Button variant="outline" full onClick={signIn}>
                Continue with Apple
              </Button>
            </div>

            <div className="my-4 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-ink/15" />
              <span className="t-micro ink-muted">or</span>
              <span className="h-px flex-1 bg-ink/15" />
            </div>

            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                signIn();
              }}
            >
              <input
                ref={firstField}
                type="email"
                required
                placeholder="Email"
                aria-label="Email"
                className="h-12 rounded-xl border-2 border-ink/20 bg-cream px-3 text-[15px] text-ink placeholder:text-ink/45 focus:border-brand"
              />
              <input
                type="password"
                required
                placeholder="Password"
                aria-label="Password"
                className="h-12 rounded-xl border-2 border-ink/20 bg-cream px-3 text-[15px] text-ink placeholder:text-ink/45 focus:border-brand"
              />
              <Button type="submit" full>
                {tab === "signup" ? "Create account" : "Log in"}
              </Button>
            </form>

            <p className="ink-muted mt-4 text-[12px]">Free forever. No card. Runs have no cash value.</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
