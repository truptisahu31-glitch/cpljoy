/**
 * Ratings are computed, never stored.
 * Every rating shown anywhere on the site comes through computeRating().
 */
export const WEIGHTS = [0.3, 0.18, 0.16, 0.09, 0.08, 0.08, 0.05, 0.03, 0.03] as const;

export const SUBJECTS = [
  "Win %",
  "Death overs (16–20)",
  "Powerplay (1–6)",
  "Rolling net run rate",
  "Momentum",
  "Home / away",
  "Key players",
  "Win quality",
  "Strength of schedule",
] as const;

export function computeRating(marks: number[], weights: readonly number[] = WEIGHTS): number {
  if (marks.length !== 9) throw new Error("nine marks required");
  return marks.reduce((s, m, i) => s + m * weights[i], 0);
}

export const DECAY_SERIES = [0.35, 0.228, 0.148, 0.096, 0.063] as const;
