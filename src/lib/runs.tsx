import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type EarnId =
  | "prediction"
  | "row-expand"
  | "show-all"
  | "challenge-locked"
  | "challenge-won"
  | "deal-touch";

export const EARN_EVENTS: Record<EarnId, number> = {
  prediction: 50,
  "row-expand": 50,
  "show-all": 50,
  "challenge-locked": 150,
  "challenge-won": 300,
  "deal-touch": 100,
};

export const TOTAL_RUNS = 700;

export type AuthTrigger = "header" | "prediction" | "challenge" | "deals" | "final";

type Ctx = {
  balance: number;
  spent: number;
  earned: number;
  credit: (id: EarnId) => void;
  spend: (amount: number) => void;
  signedIn: boolean;
  signIn: () => void;
  lastCredit: { amount: number; key: number } | null;
  authOpen: boolean;
  authTrigger: AuthTrigger;
  openAuth: (trigger: AuthTrigger) => void;
  closeAuth: () => void;
  track: (event: string, props?: Record<string, unknown>) => void;
  source: string;
};

const RunsContext = createContext<Ctx | null>(null);

function readSource(): string {
  if (typeof window === "undefined") return "direct";
  const allowed = ["willow-email", "willow-web", "cpl-web", "willow-tv"];
  const raw = new URLSearchParams(window.location.search).get("src");
  return raw && allowed.includes(raw) ? raw : "direct";
}

export function RunsProvider({ children }: { children: ReactNode }) {
  const [earned, setEarned] = useState(0);
  const [spent, setSpent] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [lastCredit, setLastCredit] = useState<{ amount: number; key: number } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTrigger, setAuthTrigger] = useState<AuthTrigger>("header");
  const fired = useRef<Set<EarnId>>(new Set());
  const source = useMemo(readSource, []);

  const track = useCallback(
    (event: string, props: Record<string, unknown> = {}) => {
      // eslint-disable-next-line no-console
      console.info("[track]", event, { ...props, src: source });
    },
    [source],
  );

  const credit = useCallback(
    (id: EarnId) => {
      if (fired.current.has(id)) return;
      fired.current.add(id);
      const amount = EARN_EVENTS[id];
      setEarned((e) => e + amount);
      setLastCredit({ amount, key: Date.now() });
      // eslint-disable-next-line no-console
      console.info("[runs] credit", id, `+${amount}`);
      toast.success(`+${amount} Runs`);
      track("runs_earned", { id, amount });
    },
    [track],
  );

  const spend = useCallback((amount: number) => setSpent((s) => s + amount), []);

  const signIn = useCallback(() => {
    setSignedIn(true);
    setEarned((e) => e + 500);
    setLastCredit({ amount: 500, key: Date.now() });
    setAuthOpen(false);
    toast.success("You're in. 500 Runs added.");
    track("signup_completed");
  }, [track]);

  const openAuth = useCallback(
    (trigger: AuthTrigger) => {
      setAuthTrigger(trigger);
      setAuthOpen(true);
      track("signup_opened", { trigger });
    },
    [track],
  );

  const value = useMemo<Ctx>(
    () => ({
      balance: Math.max(0, earned - spent),
      earned,
      spent,
      credit,
      spend,
      signedIn,
      signIn,
      lastCredit,
      authOpen,
      authTrigger,
      openAuth,
      closeAuth: () => setAuthOpen(false),
      track,
      source,
    }),
    [earned, spent, credit, spend, signedIn, signIn, lastCredit, authOpen, authTrigger, openAuth, track, source],
  );

  return <RunsContext.Provider value={value}>{children}</RunsContext.Provider>;
}

export function useRuns() {
  const ctx = useContext(RunsContext);
  if (!ctx) throw new Error("useRuns must be used inside RunsProvider");
  return ctx;
}
