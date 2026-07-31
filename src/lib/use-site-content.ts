import { useEffect, useLayoutEffect, useState } from "react";

import { fetchSiteContent, SITE, type ContentItem } from "./site-content";

/**
 * Layout effect on the client, plain effect on the server.
 *
 * This site is server-rendered, so `useLayoutEffect` alone warns during SSR.
 * The layout timing matters: the cached content is applied before the browser
 * paints, so swapping in the admin's art does not flash the bundled art first.
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const CACHE_KEY = `${SITE}:site-content`;

/**
 * Last known content, read synchronously so the very first paint already has
 * the admin's art.
 *
 * Without this the hook starts empty, every section paints its bundled image,
 * the fetch resolves a moment later and the art visibly swaps. Reading a cached
 * copy during the initial render means there is nothing to swap.
 */
function readCache(): ContentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ContentItem[]) : [];
  } catch {
    // Corrupt or unavailable storage is not worth failing over.
    return [];
  }
}

function writeCache(items: ContentItem[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(items));
  } catch {
    /* quota or private mode — the site works fine without the cache */
  }
}

/** Shallow compare so an unchanged response does not re-render the tree. */
function same(a: ContentItem[], b: ContentItem[]) {
  if (a.length !== b.length) return false;
  return a.every((x, i) => {
    const y = b[i];
    return (
      x.id === y.id &&
      x.slot === y.slot &&
      x.src === y.src &&
      x.label === y.label &&
      x.order === y.order &&
      x.active === y.active
    );
  });
}

/* ---------------------------------------------------------------------------
   One request per page, shared by every caller.

   Several sections need this content — hero, table, model, deals, the closing
   CTA — and a plain per-component `useEffect` fetch meant one HTTP request per
   component mount. Store, subscribers and in-flight promise live at module
   scope so the first caller starts the request and everyone else joins it.
   --------------------------------------------------------------------------- */

let store: ContentItem[] = [];
let hydrated = false;
let inFlight: Promise<void> | null = null;
const listeners = new Set<(items: ContentItem[]) => void>();

function publish(next: ContentItem[]) {
  if (same(store, next)) return;
  store = next;
  listeners.forEach((fn) => fn(store));
}

function load() {
  if (inFlight) return inFlight;
  inFlight = fetchSiteContent()
    .then((rows) => {
      // `null` is a failed request — keep whatever is on screen. An empty array
      // is a successful "nothing published", which must clear the cache, or a
      // deleted upload would survive in this browser forever.
      if (rows === null) return;
      writeCache(rows);
      publish(rows);
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * Loads admin-managed content once per page.
 *
 * The first render returns whatever the server rendered — nothing. That is not
 * a missed optimisation, it is the requirement: seeding this from the cache
 * made the client's first render disagree with the server HTML, and React
 * refuses to patch a mismatch, which left the affected images stranded at
 * `opacity: 0` and never loading. Cached content is applied in a layout effect
 * instead, before paint, then revalidated from the network.
 */
export function useSiteContent(): ContentItem[] {
  const [items, setItems] = useState<ContentItem[]>([]);

  useIsomorphicLayoutEffect(() => {
    if (!hydrated) {
      hydrated = true;
      const cached = readCache();
      if (cached.length) store = cached;
    }
    listeners.add(setItems);
    if (store.length) setItems(store);
    void load();
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return items;
}
