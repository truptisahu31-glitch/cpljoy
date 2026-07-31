/* ---------------------------------------------------------------------------
   Lightweight first-party analytics.

   Every click on a button/link is captured automatically by one delegated
   listener — no per-component wiring — and batched to champhunt-service.
   Nothing personal is collected: the session id is a random client-side value
   with no link to a user account.
   --------------------------------------------------------------------------- */

import { ANALYTICS_BASE } from "./site-content";

const SITE = "cpljoy";
const SESSION_KEY = "cpljoy:sessionId";
const FLUSH_MS = 4000;
const MAX_QUEUE = 25;

type CtaKind = "signup" | "app" | "engagement" | "none";

type TrackedEvent = {
  type: "pageview" | "click";
  name?: string;
  trackId?: string;
  path: string;
  section?: string;
  ctaKind: CtaKind;
  device: "mobile" | "tablet" | "desktop";
  referrer?: string;
};

let queue: TrackedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
/** Last path counted as a view, so a re-resolve of the same route isn't double counted. */
let lastPath: string | null = null;

/** The dashboard must never appear in the numbers it reports. */
function onAdmin(): boolean {
  return window.location.pathname.startsWith("/admin");
}

/** Stable-per-browser anonymous id. */
function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

function device(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/**
 * Which conversion bucket a control belongs to. An explicit `data-cta`
 * attribute wins; otherwise it is inferred from the label.
 */
export function classifyCta(label: string, explicit?: string | null): CtaKind {
  if (explicit === "signup" || explicit === "app" || explicit === "engagement") return explicit;
  const l = label.toLowerCase();
  if (/(sign up|signup|create free account|create account|get started|log in|login)/.test(l)) {
    return "signup";
  }
  if (/(app store|google play|get the app|download)/.test(l)) return "app";
  return "engagement";
}

/** Nearest enclosing section id, so clicks can be attributed to a section. */
function sectionOf(el: Element): string {
  const sec = el.closest("section[id], [data-section]");
  if (!sec) return "";
  return sec.getAttribute("id") || sec.getAttribute("data-section") || "";
}

/**
 * Readable label for a control, capped so stray content can't bloat rows.
 * `data-track` is deliberately not a source here — it is reported separately as
 * `trackId`, so the dashboard keeps the human label *and* can still tell two
 * identically-worded buttons apart.
 */
function labelOf(el: HTMLElement): string {
  const explicit = el.getAttribute("aria-label") || el.getAttribute("title");
  const text = (explicit || el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  return text.slice(0, 80) || "(unlabelled)";
}

function flush(useBeacon = false) {
  if (queue.length === 0) return;
  const payload = JSON.stringify({ site: SITE, sessionId: sessionId(), events: queue });
  queue = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  const url = `${ANALYTICS_BASE}/analytics/track`;
  try {
    // On unload only sendBeacon is guaranteed to survive.
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* analytics must never surface an error to the visitor */
    });
  } catch {
    /* ignore */
  }
}

function enqueue(e: TrackedEvent) {
  queue.push(e);
  if (queue.length >= MAX_QUEUE) {
    flush();
    return;
  }
  if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
}

/**
 * Count a view. Called on first load and again on every client-side route
 * change — without the second call a session that moved between pages was only
 * ever counted as one pageview.
 */
export function trackPageview(path?: string) {
  if (typeof window === "undefined" || onAdmin()) return;
  const p = path || window.location.pathname;
  if (p === lastPath) return;
  lastPath = p;
  enqueue({
    type: "pageview",
    path: p,
    ctaKind: "none",
    device: device(),
    referrer: document.referrer ? new URL(document.referrer).hostname : "direct",
  });
}

export function trackClick(name: string, opts: { ctaKind?: CtaKind; section?: string } = {}) {
  if (typeof window === "undefined" || onAdmin()) return;
  enqueue({
    type: "click",
    name,
    path: window.location.pathname,
    section: opts.section ?? "",
    ctaKind: opts.ctaKind ?? classifyCta(name),
    device: device(),
  });
}

/**
 * Install the global listeners. Idempotent and a no-op on the server.
 *
 * The listeners are installed even when the visit starts on /admin — the
 * dashboard is excluded per event instead, so that opening /admin first and
 * then browsing the site still records that browsing. Previously the whole
 * install was skipped and the rest of the session went uncounted.
 */
export function initAnalytics() {
  if (typeof window === "undefined" || started) return;
  started = true;

  trackPageview();

  // One delegated listener covers every current and future control.
  document.addEventListener(
    "click",
    (ev) => {
      const target = ev.target as Element | null;
      if (!target || !target.closest) return;
      const el = target.closest(
        "button, a, [role='button'], [data-track]"
      ) as HTMLElement | null;
      if (!el || onAdmin()) return;

      const label = labelOf(el);
      enqueue({
        type: "click",
        name: label,
        trackId: el.getAttribute("data-track") || "",
        path: window.location.pathname,
        section: sectionOf(el),
        ctaKind: classifyCta(label, el.getAttribute("data-cta")),
        device: device(),
      });
    },
    { capture: true, passive: true }
  );

  // Don't lose the tail of a session.
  window.addEventListener("pagehide", () => flush(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}
