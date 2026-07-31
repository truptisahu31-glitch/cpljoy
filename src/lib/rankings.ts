/* ---------------------------------------------------------------------------
   Published power rankings.

   The table used to render the hardcoded `rankings` array in site.config, so a
   new week meant a code change and a deploy. It now reads whatever was last
   published through champhunt-service, and falls back to the bundled array when
   nothing is published, the request fails, or we are rendering on the server.

   That fallback is the whole safety story: the table always has a complete,
   coherent week to draw, and the network is only ever an upgrade.

   The upload format is the Willow Predictor's "Export for website" file
   (`kind: "champhunt-site-rankings"`), consumed exactly as the Predictor emits
   it — including its own factor list and its own ratings, which is why nothing
   here recomputes a published rating.
   --------------------------------------------------------------------------- */

import { ANALYTICS_BASE, SITE } from "./site-content";
import { rankings as staticRows, teamOf, teams } from "@/content/site.config";
import { SUBJECTS, WEIGHTS, computeRating } from "./rating";

export { ANALYTICS_BASE, SITE };

export type Movement = "up" | "down" | "same" | "new";

/** One team as stored by the service — the Predictor's export, field for field. */
export type PublishedTeam = {
  rank: number;
  prev: number;
  delta: number;
  movement: Movement;
  team: string;
  short: string;
  abbr: string;
  color: string;
  secondary: string;
  logo: string | null;
  rating: number;
  played: number;
  w: number;
  l: number;
  nrr: string;
  rollingNrr: string;
  form: ("W" | "L")[];
  streak: { type: "W" | "L"; len: number } | null;
  blurb: string;
  blurbSource: "ai" | "template";
  /** 0-100 per factor key — keys match `PublishedFactor.key`. */
  marks: Record<string, number>;
};

export type PublishedFactor = {
  n: number;
  key: string;
  name: string;
  note: string;
  /** Whole percentage, e.g. 30 for 30%. */
  weight: number;
  optional: boolean;
};

export type PublishedWeek = {
  site: string;
  league: string;
  leagueShort: string;
  season: string;
  week: number;
  weekLabel: string;
  headline: string;
  subhead: string;
  teams: PublishedTeam[];
  factors: PublishedFactor[];
  matchCount: number;
  publishedAt: string;
};

export type WeekMeta = {
  week: number;
  weekLabel: string;
  season: string;
  publishedAt: string;
  matchCount: number;
};

/* ------------------------------- view model ------------------------------ */

/*
 * The table renders this, never a `PublishedWeek` directly.
 *
 * A published week and the bundled week disagree about almost everything —
 * marks keyed by factor vs. a fixed array, percentages vs. fractions, a stored
 * rating vs. a computed one. Normalising once here is what lets the table have
 * a single rendering path instead of branching on "is this published?" in every
 * row, panel and progress bar.
 */

export type RowFactor = {
  key: string;
  name: string;
  /** Whole percentage. */
  weight: number;
  /** 0-100. */
  mark: number;
};

export type Row = {
  rank: number;
  prev: number;
  abbr: string;
  name: string;
  short: string;
  color: string;
  /** Site-local logo path, or null when this team isn't one of ours. */
  logo: string | null;
  rating: number;
  w: number;
  l: number;
  nrr: string;
  form: string[];
  blurb: string;
  factors: RowFactor[];
};

export type WeekView = {
  week: number;
  label: string;
  season: string;
  /** False means this is the bundled week, not something an admin uploaded. */
  published: boolean;
  rows: Row[];
};

/**
 * Team identity stays with the site, not the file.
 *
 * The Predictor ships its own colours and a `/logos/…` path that only resolves
 * on the Predictor's own server. For a team we already know, ours win — the
 * page keeps its art. For one we don't, the file's colour is better than
 * silently rendering another team's crest, which is what `teamOf` would do with
 * an unknown abbr.
 */
function identity(t: PublishedTeam) {
  const known = teams.find((x) => x.abbr === t.abbr);
  return {
    color: known?.color ?? t.color,
    logo: known?.logo ?? null,
    name: known?.name ?? t.team,
    short: known?.short ?? t.short,
  };
}

/** A published week, flattened for the table. */
export function viewOf(week: PublishedWeek): WeekView {
  const factors = week.factors ?? [];

  return {
    week: week.week,
    label: week.weekLabel || `Week ${week.week}`,
    season: week.season,
    published: true,
    rows: week.teams.map((t) => {
      const id = identity(t);
      return {
        rank: t.rank,
        prev: t.prev,
        abbr: t.abbr,
        name: id.name,
        short: id.short,
        color: id.color,
        logo: id.logo,
        // The Predictor's rating is authoritative: it comes straight from the
        // same engine that produced the broadcast graphic, and recomputing it
        // here against different weights would put two different numbers on
        // screen for one team.
        rating: t.rating,
        w: t.w,
        l: t.l,
        nrr: t.nrr,
        form: t.form ?? [],
        blurb: t.blurb ?? "",
        factors: factors.map((f) => ({
          key: f.key,
          name: f.name || f.key,
          weight: f.weight,
          mark: t.marks?.[f.key] ?? 0,
        })),
      };
    }),
  };
}

/** Bundled key for a subject name, so the fallback has the same shape. */
const keyOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * The bundled week, in the same shape.
 *
 * This is what renders on the server, on a first visit with nothing published,
 * and after an admin deletes every uploaded week.
 */
export function fallbackWeek(): WeekView {
  return {
    week: 1,
    label: "Week 1",
    season: "2026",
    published: false,
    rows: staticRows.map((r) => {
      const team = teamOf(r.abbr);
      return {
        rank: r.rank,
        prev: r.prev,
        abbr: r.abbr,
        name: team.name,
        short: team.short,
        color: team.color,
        logo: team.logo,
        rating: computeRating(r.marks),
        w: r.w,
        l: r.l,
        nrr: r.nrr,
        form: r.form,
        blurb: "",
        factors: SUBJECTS.map((name, i) => ({
          key: keyOf(name),
          name,
          // WEIGHTS are fractions; the published file uses whole percentages.
          weight: Math.round(WEIGHTS[i] * 1000) / 10,
          mark: r.marks[i],
        })),
      };
    }),
  };
}

/* --------------------------------- fetch --------------------------------- */

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${ANALYTICS_BASE}${path}`, { signal });
    // 404 is the normal "nothing published yet" answer, not a failure.
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json?.data ?? null;
  } catch {
    // Offline, CORS, service down — the caller keeps its fallback.
    return null;
  }
}

/** Every published week for this site, oldest first. */
export async function fetchWeeks(signal?: AbortSignal): Promise<WeekMeta[]> {
  return (await getJson<WeekMeta[]>(`/power-rankings/weeks?site=${SITE}`, signal)) ?? [];
}

export function fetchWeek(week: number, signal?: AbortSignal) {
  return getJson<PublishedWeek>(`/power-rankings/week/${week}?site=${SITE}`, signal);
}
