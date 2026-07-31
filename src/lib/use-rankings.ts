import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fallbackWeek,
  fetchWeek,
  fetchWeeks,
  viewOf,
  type WeekMeta,
  type WeekView,
} from "./rankings";

/**
 * The table's data source: every published week, and the one on screen.
 *
 * The first render — server and client alike — is the bundled week. Seeding
 * anything else here would make the client's first render disagree with the
 * server HTML, and React refuses to patch a mismatch. Published weeks arrive in
 * an effect and replace it.
 *
 * With nothing published, or with every week deleted from /admin, `weeks` is
 * empty and the bundled table is what stays on screen. That is the intended
 * resting state, not a failure mode.
 */
export function useRankings() {
  const bundled = useMemo(fallbackWeek, []);

  const [weeks, setWeeks] = useState<WeekMeta[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<WeekView>(bundled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Weeks already fetched. Switching back to one is then instant, and clicking
  // along 01 → 02 → 03 → 02 does not re-request what we already have.
  const cache = useRef(new Map<number, WeekView>());
  const alive = useRef(true);

  const show = useCallback(async (week: number, signal?: AbortSignal) => {
    const cached = cache.current.get(week);
    if (cached) {
      setSelected(week);
      setView(cached);
      setError(null);
      return;
    }

    setSelected(week);
    setLoading(true);
    setError(null);
    const published = await fetchWeek(week, signal);
    if (!alive.current || signal?.aborted) return;
    setLoading(false);

    if (!published) {
      // The week is listed but wouldn't load. Leaving the previous table up is
      // better than blanking it — but the selector now points at a week that
      // isn't on screen, so say so rather than quietly showing the wrong one.
      setError("That week could not be loaded. Showing the previous table.");
      return;
    }
    const next = viewOf(published);
    cache.current.set(week, next);
    setView(next);
  }, []);

  useEffect(() => {
    alive.current = true;
    const ac = new AbortController();

    void (async () => {
      const list = await fetchWeeks(ac.signal);
      if (!alive.current || ac.signal.aborted || list.length === 0) return;
      setWeeks(list);
      // The newest week is what the site is "currently" showing; the older
      // buttons are history the visitor can go back to.
      await show(list[list.length - 1].week, ac.signal);
    })();

    return () => {
      alive.current = false;
      ac.abort();
    };
  }, [show]);

  return { weeks, selected, view, loading, error, show };
}
