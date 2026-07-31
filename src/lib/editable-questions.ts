import { challenge as bundledChallenge, prediction as bundledPrediction } from "@/content/site.config";
import { itemFor, type ContentItem } from "./site-content";

/* ---------------------------------------------------------------------------
   Admin-editable questions.

   The "Call it" prediction and the "Back yourself" challenge are stored as JSON
   in text slots. Everything here parses defensively: a missing, malformed or
   half-filled value falls back to the bundled question rather than rendering an
   unanswerable card. A broken edit costs the operator their change, never the
   visitor their page.
   --------------------------------------------------------------------------- */

export type EditableOption = { id: string; label: string };

export type EditablePrediction = {
  question: string;
  options: EditableOption[];
  meta: string;
  edge_case_rule: string;
  hook: string;
};

export type EditableChallenge = {
  question: string;
  options: EditableOption[];
  meta: string;
  edge_case_rule: string;
  closeLine: string;
  payout_multiplier: number;
  stakes: number[];
};

const str = (v: unknown, fallback: string) =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** At least two answers, each with a usable label — anything less is unanswerable. */
function parseOptions(v: unknown, fallback: EditableOption[]): EditableOption[] {
  if (!Array.isArray(v)) return fallback;
  const cleaned = v
    .filter((o): o is Record<string, unknown> => !!o && typeof o === "object")
    .map((o, i) => ({
      id: str(o.id, `opt-${i + 1}`),
      label: str(o.label, ""),
    }))
    .filter((o) => o.label);
  return cleaned.length >= 2 ? cleaned : fallback;
}

/** The bundled question, in the editable shape — also what /admin pre-fills. */
export function defaultPrediction(): EditablePrediction {
  return {
    question: bundledPrediction.question,
    options: bundledPrediction.options.map((o) => ({ ...o })),
    meta: bundledPrediction.meta,
    edge_case_rule: bundledPrediction.edge_case_rule,
    hook: bundledPrediction.hook,
  };
}

export function defaultChallenge(): EditableChallenge {
  return {
    question: bundledChallenge.question,
    options: bundledChallenge.options.map((o) => ({ ...o })),
    meta: bundledChallenge.meta,
    edge_case_rule: bundledChallenge.edge_case_rule,
    closeLine: bundledChallenge.closeLine,
    payout_multiplier: bundledChallenge.payout_multiplier,
    stakes: [...bundledChallenge.stakes],
  };
}

function parseJson(raw: string | undefined): unknown {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // A malformed slot is the same as an empty one: use the bundled question.
    return null;
  }
}

export function predictionFrom(items: ContentItem[]): EditablePrediction {
  const base = defaultPrediction();
  const parsed = parseJson(itemFor(items, "predictionQuestion")?.text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return base;
  const v = parsed as Record<string, unknown>;
  return {
    question: str(v.question, base.question),
    options: parseOptions(v.options, base.options),
    meta: str(v.meta, base.meta),
    edge_case_rule: str(v.edge_case_rule, base.edge_case_rule),
    hook: str(v.hook, base.hook),
  };
}

export function challengeFrom(items: ContentItem[]): EditableChallenge {
  const base = defaultChallenge();
  const parsed = parseJson(itemFor(items, "challengeQuestions")?.text);
  // Stored as an array — the service validates it as a set — but this site
  // renders one challenge, so the first usable entry wins.
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!first || typeof first !== "object") return base;
  const v = first as Record<string, unknown>;
  const stakes = Array.isArray(v.stakes)
    ? v.stakes.filter((n): n is number => typeof n === "number" && n > 0)
    : [];
  return {
    question: str(v.question, base.question),
    options: parseOptions(v.options, base.options),
    meta: str(v.meta, base.meta),
    edge_case_rule: str(v.edge_case_rule, base.edge_case_rule),
    closeLine: str(v.closeLine, base.closeLine),
    payout_multiplier: num(v.payout_multiplier, base.payout_multiplier),
    stakes: stakes.length ? stakes : base.stakes,
  };
}
