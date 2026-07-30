import hero01 from "@/assets/hero-01.jpg";
import hero02 from "@/assets/hero-02.jpg";
import hero03 from "@/assets/hero-03.jpg";
import crowd01 from "@/assets/crowd-01.jpg";
import crowd02 from "@/assets/crowd-02.jpg";
import ctaBg from "@/assets/cta-bg.jpg";
import playerCutout from "@/assets/player-cutout.png";
import dealPass from "@/assets/deal-pass.jpg";
import dealFood from "@/assets/deal-food.jpg";
import dealGear from "@/assets/deal-gear.jpg";
import dealMerch from "@/assets/deal-merch.jpg";
import dealTickets from "@/assets/deal-tickets.jpg";

export const teams = [
  { abbr: "TKR", name: "Trinbago Knight Riders", short: "Trinbago", color: "#E0218A", logo: "/assets/teams/tkr.svg" },
  { abbr: "GAW", name: "Guyana Amazon Warriors", short: "Guyana", color: "#17B978", logo: "/assets/teams/gaw.svg" },
  { abbr: "BR", name: "Barbados Royals", short: "Barbados", color: "#3E6BE0", logo: "/assets/teams/br.svg" },
  { abbr: "SLK", name: "Saint Lucia Kings", short: "St Lucia", color: "#0FA3A0", logo: "/assets/teams/slk.svg" },
  { abbr: "SKN", name: "St Kitts & Nevis Patriots", short: "St Kitts", color: "#FF5E5B", logo: "/assets/teams/skn.svg" },
  { abbr: "JT", name: "Jamaica Tallawahs", short: "Jamaica", color: "#E09B00", logo: "/assets/teams/jt.svg" },
  { abbr: "ABF", name: "Antigua & Barbuda Falcons", short: "Antigua", color: "#6B2FB5", logo: "/assets/teams/abf.svg" },
];

export type Team = (typeof teams)[number];

export function teamOf(abbr: string): Team {
  return teams.find((t) => t.abbr === abbr) ?? teams[0];
}

// marks order matches SUBJECTS. Ratings in comments are computed output — never stored.
export const rankings = [
  { rank: 1, prev: 3, abbr: "TKR", w: 4, l: 1, nrr: "+1.24", form: ["W", "W", "L", "W", "W"], marks: [80, 82, 74, 71, 78, 62, 85, 70, 52] }, // 76.1
  { rank: 2, prev: 1, abbr: "GAW", w: 4, l: 2, nrr: "+0.88", form: ["W", "L", "W", "W", "L"], marks: [67, 68, 49, 66, 58, 71, 88, 64, 55] }, // 64.4
  { rank: 3, prev: 2, abbr: "BR", w: 3, l: 2, nrr: "+0.41", form: ["L", "W", "W", "L", "W"], marks: [60, 57, 68, 58, 52, 40, 90, 66, 50] }, // 59.7
  { rank: 4, prev: 6, abbr: "SLK", w: 3, l: 3, nrr: "+0.12", form: ["W", "W", "W", "L", "L"], marks: [50, 54, 52, 55, 86, 58, 76, 60, 51] }, // 56.6
  { rank: 5, prev: 4, abbr: "SKN", w: 2, l: 3, nrr: "-0.33", form: ["L", "W", "L", "W", "L"], marks: [40, 34, 48, 45, 44, 52, 72, 48, 49] }, // 44.0
  { rank: 6, prev: 5, abbr: "ABF", w: 2, l: 4, nrr: "-0.71", form: ["L", "L", "W", "L", "W"], marks: [33, 38, 36, 38, 41, 46, 34, 42, 53] }, // 37.4
  { rank: 7, prev: 7, abbr: "JT", w: 1, l: 4, nrr: "-1.02", form: ["L", "L", "L", "W", "L"], marks: [20, 30, 33, 29, 26, 38, 68, 36, 54] }, // 30.5
];

export type Ranking = (typeof rankings)[number];

export const heroSlides = [
  { src: hero01, alt: "Floodlit cricket stadium at night, full house waving flags", focal: "50% 45%", venue: "Providence Stadium, Guyana" },
  { src: hero02, alt: "Caribbean cricket ground at dusk with palm trees behind the stands", focal: "50% 50%", venue: "Brian Lara Stadium, Trinidad" },
  { src: hero03, alt: "Night cricket stadium with a packed, flag-waving crowd", focal: "50% 48%", venue: "Kensington Oval, Barbados" },
];

export const crowdFrames = [
  { src: crowd01, alt: "Cricket fans in the stands waving Caribbean flags" },
  { src: crowd02, alt: "Fans celebrating a wicket in a packed stand" },
  { src: hero01, alt: "Wide view of a floodlit stadium at night" },
  { src: hero03, alt: "Stadium stands lit in carnival colours" },
];

export const players = [{ id: "pooran", name: "Nicholas Pooran", image: playerCutout }];

export const deals = [
  { id: "pass", cat: "Match pass", offer: "One-match live pass", cost: 500, image: dealPass, alt: "Live cricket on a tablet at home", terms: "One redemption per account." },
  { id: "food", cat: "Food delivery", offer: "$15 off your match-day order", cost: 1800, image: dealFood, alt: "Match-day food spread in takeaway trays", terms: "Minimum order applies." },
  { id: "gear", cat: "Sports gear", offer: "20% off cricket gear", cost: 2500, image: dealGear, alt: "Cricket bat, gloves and ball on a dark surface", terms: "Selected ranges." },
  { id: "merch", cat: "Merch", offer: "Team jersey, 30% off", cost: 3200, image: dealMerch, alt: "Folded cricket jersey", terms: "While stocks last." },
  { id: "tix", cat: "Match tickets", offer: "CPL final, two seats", cost: 25000, image: dealTickets, alt: "Two front-row seats overlooking a floodlit ground", terms: "Subject to availability." },
];

export const site = {
  ctaBackground: ctaBg,
  seasonStatus: "live" as "preseason" | "live" | "final",
  tournament: { teams: 7, matches: 39, rankings: 7, measurements: 9 },
  contact: { user: "sameer.kanva", domain: "champhunt.com" },
};

/** Prediction card (Section 4) — rendered from the generator payload, never hardcoded in the view. */
export const prediction = {
  id: "p-014-outcome",
  question: "Who wins?",
  options: [
    { id: "opt-gaw", label: "GAW" },
    { id: "opt-br", label: "BR" },
  ],
  category: "match_outcome" as const,
  fixture_label: "Guyana Amazon Warriors v Barbados Royals",
  venue: "Providence Stadium",
  team_abbrs: ["GAW", "BR"] as [string, string],
  resolution_source: "Match result",
  source_of_record: "CPL scorecard",
  edge_case_rule: "If the match is abandoned, this voids and no Runs change hands",
  opens_at: "2026-08-27T12:00:00Z",
  closes_at: "2026-08-28T22:30:00Z",
  review_status: "approved" as const,
  hook: "Nice call. Now back it with something.",
  meta: "Match 14 · Providence Stadium · Fri 28 Aug, 7:00 PM ET",
  split: 58,
};

/** Challenge card (Section 5). */
export const challenge = {
  id: "c-015-pooran-50",
  question: "Will Nicholas Pooran score 50 or more tonight?",
  options: [
    { id: "opt-yes", label: "Yes" },
    { id: "opt-no", label: "No" },
  ],
  category: "batting" as const,
  fixture_label: "Trinbago Knight Riders v Guyana Amazon Warriors",
  venue: "Brian Lara Stadium",
  team_abbrs: ["TKR", "GAW"] as [string, string],
  player_ids: ["pooran"],
  resolution_source: "Batting scorecard",
  source_of_record: "CPL scorecard",
  edge_case_rule: "If Pooran doesn't bat, this voids and your Runs come back",
  opens_at: "2026-08-29T12:00:00Z",
  closes_at: "2026-08-29T22:30:00Z",
  review_status: "approved" as const,
  difficulty: "medium" as const,
  payout_multiplier: 2,
  min_stake: 50,
  max_stake: null,
  meta: "Match 15 · Brian Lara Stadium · Tonight, 7:00 PM ET",
  closeLine: "Closes at the toss · 2,847 fans have answered",
  demoBalance: 180,
  stakes: [50, 100, 250],
};

export const nav = [
  { label: "Rankings", href: "#rankings" },
  { label: "Play", href: "#call-it" },
  { label: "Deals", href: "#deals" },
];
