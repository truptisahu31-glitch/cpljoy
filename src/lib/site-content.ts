/* ---------------------------------------------------------------------------
   Editable site content.

   Served by champhunt-service `/sitecontent`, managed from /admin. Everything
   here degrades to the bundled default: if the service is down, the slot is
   empty, or the request fails, the page renders exactly as it does with no
   admin at all. The admin replaces art; it is never required for the site to
   work.
   --------------------------------------------------------------------------- */

export const ANALYTICS_BASE =
  (import.meta as { env?: Record<string, string> }).env?.VITE_ANALYTICS_BASE ||
  "https://champhunt-service.champhunt.online";

export const SITE = "cpljoy";

export type ContentSlot =
  /** Hero background frames (ordered). */
  | "heroCarousel"
  /** In-app screens behind the "We built the model" tabs. */
  | "appMockup"
  /** Background behind the closing CTA. */
  | "finalCtaBackdrop"
  /** Crowd photography — the model-section grid and the marquee. */
  | "crowdFrame"
  /** One per deal card, labelled with the deal id. */
  | "dealImage"
  /** The cut-out player in the hero. */
  | "playerCutout"
  /** JSON: the "Call it" prediction, its answers and its copy. */
  | "predictionQuestion"
  /** JSON: the "Back yourself" challenge set. */
  | "challengeQuestions";

export type ContentItem = {
  id: string;
  slot: ContentSlot;
  text: string;
  alt: string;
  label: string;
  link: string;
  order: number;
  active: boolean;
  bytes: number;
  contentType: string;
  originalName: string;
  updatedAt?: string;
  /** Relative path on the service; use `assetUrl()` to make it absolute. */
  src: string;
};

/** Image paths come back relative to the service host, not this site. */
export function assetUrl(src: string): string {
  if (!src) return "";
  return /^https?:/i.test(src) ? src : `${ANALYTICS_BASE}${src}`;
}

/**
 * Public read.
 *
 * `null` means the request failed — offline, CORS, service down — and the
 * caller should keep whatever it already has. An empty array means the request
 * succeeded and nothing is published, which is a real answer: the caller must
 * drop any cached content and fall back to bundled art. Collapsing the two (as
 * this used to) meant deleting an upload from /admin never took effect on a
 * browser that had already cached it.
 */
export async function fetchSiteContent(signal?: AbortSignal): Promise<ContentItem[] | null> {
  try {
    const res = await fetch(`${ANALYTICS_BASE}/sitecontent?site=${SITE}`, { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: ContentItem[] };
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return null;
  }
}

/** All items for one slot, in admin-defined order. */
export function itemsFor(items: ContentItem[], slot: ContentSlot): ContentItem[] {
  return items.filter((i) => i.slot === slot && i.active).sort((a, b) => a.order - b.order);
}

/** The single value for a slot, or null. */
export function itemFor(items: ContentItem[], slot: ContentSlot): ContentItem | null {
  return itemsFor(items, slot)[0] ?? null;
}

/** A labelled member of a repeatable slot, e.g. the "pitch" mockup. */
export function itemByLabel(
  items: ContentItem[],
  slot: ContentSlot,
  label: string,
): ContentItem | null {
  const want = label.trim().toLowerCase();
  return itemsFor(items, slot).find((i) => i.label.trim().toLowerCase() === want) ?? null;
}

/**
 * Resolve an image slot to a URL, falling back to a bundled asset.
 *
 * This is the call every section makes, so the fallback is built in rather than
 * left to each caller to remember.
 */
export function imageOr(
  items: ContentItem[],
  slot: ContentSlot,
  fallback: string,
  label?: string,
): string {
  const item = label ? itemByLabel(items, slot, label) : itemFor(items, slot);
  return item?.src ? assetUrl(item.src) : fallback;
}
