import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { ANALYTICS_BASE, SITE, assetUrl, type ContentItem } from "@/lib/site-content";
import {
  challengeFrom,
  defaultChallenge,
  defaultPrediction,
  predictionFrom,
  type EditableChallenge,
  type EditableOption,
  type EditablePrediction,
} from "@/lib/editable-questions";

type ButtonRow = {
  name: string;
  trackId: string;
  section: string;
  ctaKind: string;
  clicks: number;
  uniqueClickers: number;
};

type Summary = {
  site: string;
  windowDays: number;
  totals: {
    visitors: number;
    pageviews: number;
    clicks: number;
    events: number;
    converted: number;
    engaged: number;
    conversionRate: number;
    engagementRate: number;
    bounceRate: number;
    clicksPerVisitor: number;
    pagesPerVisitor: number;
  };
  buttons: ButtonRow[];
  daily: { day: string; visitors?: number; pageviews?: number; clicks?: number }[];
  paths: { path: string; views: number }[];
  devices: { device: string; visitors: number }[];
  referrers: { referrer: string; visitors: number }[];
  sections: { section: string; clicks: number }[];
  recent: { name?: string; type: string; path?: string; section?: string; at?: string }[];
};

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

/* ---------------------------------------------------------------------------
   Image console for cpljoy.

   Every photograph on the landing page is managed here. The login returns the
   same 12h token the analytics dashboard uses, so one password covers the whole
   admin, and the data is protected server-side — the gate is a real check, not
   a client-side illusion.

   Nothing here is required for the site to work: an empty slot means the page
   renders its bundled art, which is also what happens if this service is down.
   --------------------------------------------------------------------------- */

const TOKEN_KEY = "cpljoy:adminToken";

type Slot = {
  slot: string;
  title: string;
  blurb: string;
  /** Repeatable slots take many images; single slots hold one. */
  multi: boolean;
  /** Fixed members of a repeatable slot — the tabs/cards they map to. */
  labels?: { id: string; name: string; bundled: string }[];
  /** Alt text is mandatory except on purely decorative backdrops. */
  altOptional?: boolean;
};

const SLOTS: Slot[] = [
  {
    slot: "appMockup",
    title: "App screens",
    blurb:
      "The phone shown in “We built the model”. Each tab has its own screen — the four shipped screens are shown below and stay in place until you replace them.",
    multi: true,
    labels: [
      { id: "pitch", name: "Pitch", bundled: "/mockups/pitch.png" },
      { id: "dugout", name: "Dugout", bundled: "/mockups/dugout.png" },
      { id: "arena", name: "Arena", bundled: "/mockups/arena.png" },
      { id: "deals", name: "Deals", bundled: "/mockups/deals.png" },
    ],
  },
  {
    slot: "heroCarousel",
    title: "Hero frames",
    blurb:
      "The rotating background at the top of the page. Uploading any frame replaces the bundled set entirely, so upload all the frames you want shown.",
    multi: true,
  },
  {
    slot: "crowdFrame",
    title: "Crowd photography",
    blurb:
      "Used behind the table rows, the model section and the marquee strip. Uploading any frame replaces the bundled set.",
    multi: true,
  },
  {
    slot: "dealImage",
    title: "Deal cards",
    blurb: "One image per offer. Replace individually — the rest stay as they are.",
    multi: true,
    labels: [
      { id: "pass", name: "Match pass", bundled: "" },
      { id: "food", name: "Food delivery", bundled: "" },
      { id: "gear", name: "Sports gear", bundled: "" },
      { id: "merch", name: "Merch", bundled: "" },
      { id: "tix", name: "Match tickets", bundled: "" },
    ],
  },
  {
    slot: "finalCtaBackdrop",
    title: "Closing section backdrop",
    blurb: "The photograph behind the final call to action.",
    multi: false,
    altOptional: true,
  },
  {
    slot: "playerCutout",
    title: "Hero player cut-out",
    blurb: "The cut-out figure in the hero. A transparent PNG works best.",
    multi: false,
  },
];

/* ------------------------------- transport ------------------------------- */

async function readError(res: Response, fallback: string) {
  try {
    const j = await res.json();
    return (j as { error?: string })?.error || fallback;
  } catch {
    return fallback;
  }
}

/* --------------------------------- login --------------------------------- */

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${ANALYTICS_BASE}/analytics/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error(await readError(res, "Sign in failed"));
      const json = (await res.json()) as { token?: string };
      if (!json.token) throw new Error("No token returned");
      onToken(json.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#141024] px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-[380px] rounded-2xl border border-[#2e2a45] bg-[#1b1730] p-6"
      >
        <h1 className="text-[22px] font-bold text-white">cpljoy admin</h1>
        <p className="mt-1 text-[14px] text-[#a9a4c4]">Analytics, questions and artwork.</p>

        <label className="mt-5 block text-[13px] font-medium text-[#cfcbe4]">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-[#3a3557] bg-[#16121f] px-3 py-2 text-[14px] text-white outline-none focus:border-[#8b5cf6]"
          />
        </label>

        <label className="mt-3 block text-[13px] font-medium text-[#cfcbe4]">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-[#3a3557] bg-[#16121f] px-3 py-2 text-[14px] text-white outline-none focus:border-[#8b5cf6]"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-lg border border-[#7f1d3a] bg-[#2a1020] px-3 py-2 text-[13px] text-[#ff9db4]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !username || !password}
          className="mt-5 w-full rounded-lg bg-[#7c3aed] px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}


/* ------------------------------- analytics ------------------------------- */

const CARD = "rounded-xl border border-[#2e2a45] bg-[#191430] p-3";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={CARD}>
      <p className="text-[12px] uppercase tracking-wide text-[#a9a4c4]">{label}</p>
      <p className="mt-1 text-[24px] font-bold tabular-nums text-white">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-[#6f6a90]">{hint}</p>}
    </div>
  );
}

/** Horizontal bar list — used for every "top N" breakdown. */
function BarList({
  rows,
  empty,
}: {
  rows: { label: string; value: number; sub?: string }[];
  empty: string;
}) {
  if (!rows.length) return <p className="text-[13px] text-[#6f6a90]">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="grid gap-1.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[13px] text-[#e8e5f5]">{r.label}</span>
              {r.sub && <span className="shrink-0 text-[11px] text-[#6f6a90]">{r.sub}</span>}
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#241f3d]">
              <div
                className="h-full rounded-full bg-[#7c3aed]"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-12 text-right text-[13px] font-semibold tabular-nums text-white">
            {r.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function Analytics({
  token,
  onExpired,
}: {
  token: string;
  onExpired: () => void;
}) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${ANALYTICS_BASE}/analytics/admin/summary?site=${SITE}&days=${days}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.status === 401) {
        onExpired();
        return;
      }
      if (!res.ok) throw new Error(await readError(res, "Could not load analytics"));
      const json = (await res.json()) as { data?: Summary };
      setData(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics");
    } finally {
      setBusy(false);
    }
  }, [token, days, onExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${ANALYTICS_BASE}/analytics/admin/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site: SITE }),
      });
      if (!res.ok) throw new Error(await readError(res, "Reset failed"));
      const json = (await res.json()) as { data?: { deleted?: number } };
      setNotice(`${json.data?.deleted ?? 0} events deleted. Every figure is back to zero.`);
      setConfirming(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  const t = data?.totals;
  const topDay = (data?.daily ?? [])
    .slice()
    .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0))[0];

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-bold">Traffic &amp; engagement</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-[#3a3557] bg-[#16121f] px-2 py-1.5 text-[13px] text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button
          onClick={() => void load()}
          disabled={busy}
          className="rounded-lg border border-[#3a3557] px-3 py-1.5 text-[13px] font-semibold disabled:opacity-50"
        >
          {busy ? "Loading…" : "Refresh"}
        </button>
        <button
          onClick={() => setConfirming(true)}
          disabled={busy}
          className="ml-auto rounded-lg border border-[#6b2436] px-3 py-1.5 text-[13px] font-semibold text-[#ff9db4] disabled:opacity-50"
        >
          Reset tracking
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-[#7f1d3a] bg-[#2a1020] px-3 py-2 text-[13px] text-[#ff9db4]">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-lg border border-[#1e5f43] bg-[#0f2a20] px-3 py-2 text-[13px] text-[#8ee6b8]">
          {notice}
        </p>
      )}

      {/* Reset is irreversible, so it asks first and names the cost. */}
      {confirming && (
        <div className="mt-3 rounded-xl border border-[#6b2436] bg-[#241019] p-4">
          <p className="text-[15px] font-semibold text-white">Reset all tracking?</p>
          <p className="mt-1 text-[13px] text-[#e2b5c2]">
            This permanently deletes every recorded visit and click for this site
            {t ? ` — ${t.events.toLocaleString()} events` : ""}. Counts go to zero and the
            history cannot be recovered. Published images and questions are not affected.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void reset()}
              disabled={busy}
              className="rounded-lg bg-[#b3243f] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-[#3a3557] px-3 py-2 text-[13px] font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {t && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Visitors" value={t.visitors.toLocaleString()} hint={`${data?.windowDays}-day window`} />
            <Stat label="Pageviews" value={t.pageviews.toLocaleString()} hint={`${t.pagesPerVisitor} per visitor`} />
            <Stat label="Clicks" value={t.clicks.toLocaleString()} hint={`${t.clicksPerVisitor} per visitor`} />
            <Stat label="Total events" value={t.events.toLocaleString()} />
            <Stat label="Engagement rate" value={`${t.engagementRate}%`} hint={`${t.engaged.toLocaleString()} clicked something`} />
            <Stat label="Conversion rate" value={`${t.conversionRate}%`} hint={`${t.converted.toLocaleString()} hit sign-up or app`} />
            <Stat label="Bounce rate" value={`${t.bounceRate}%`} hint="Visited, never clicked" />
            <Stat
              label="Best day"
              value={topDay ? `${(topDay.clicks ?? 0).toLocaleString()}` : "—"}
              hint={topDay ? `${topDay.day} · peak clicks` : "No activity yet"}
            />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className={CARD}>
              <h3 className="text-[15px] font-semibold">Every button, by clicks</h3>
              <p className="mb-3 mt-0.5 text-[12px] text-[#6f6a90]">
                Captured automatically — no button needs wiring up.
              </p>
              <BarList
                rows={(data?.buttons ?? []).map((b) => ({
                  label: b.name,
                  value: b.clicks,
                  sub: [b.section, b.ctaKind, `${b.uniqueClickers} people`]
                    .filter(Boolean)
                    .join(" · "),
                }))}
                empty="No clicks recorded yet."
              />
            </div>

            <div className={CARD}>
              <h3 className="text-[15px] font-semibold">Sections by clicks</h3>
              <p className="mb-3 mt-0.5 text-[12px] text-[#6f6a90]">Where the attention actually goes.</p>
              <BarList
                rows={(data?.sections ?? []).map((x) => ({ label: x.section || "(none)", value: x.clicks }))}
                empty="No section activity yet."
              />
            </div>

            <div className={CARD}>
              <h3 className="mb-3 text-[15px] font-semibold">Devices</h3>
              <BarList
                rows={(data?.devices ?? []).map((d) => ({ label: d.device, value: d.visitors }))}
                empty="No visits yet."
              />
            </div>

            <div className={CARD}>
              <h3 className="mb-3 text-[15px] font-semibold">Where they came from</h3>
              <BarList
                rows={(data?.referrers ?? []).map((r) => ({ label: r.referrer || "direct", value: r.visitors }))}
                empty="No referrers yet."
              />
            </div>

            <div className={CARD}>
              <h3 className="mb-3 text-[15px] font-semibold">Pages</h3>
              <BarList
                rows={(data?.paths ?? []).map((p) => ({ label: p.path, value: p.views }))}
                empty="No pageviews yet."
              />
            </div>

            <div className={CARD}>
              <h3 className="mb-3 text-[15px] font-semibold">Daily activity</h3>
              <BarList
                rows={(data?.daily ?? []).map((d) => ({
                  label: d.day,
                  value: d.clicks ?? 0,
                  sub: `${d.visitors ?? 0} visitors · ${d.pageviews ?? 0} views`,
                }))}
                empty="Nothing recorded yet."
              />
            </div>
          </div>

          <div className={`mt-3 ${CARD}`}>
            <h3 className="mb-2 text-[15px] font-semibold">Most recent activity</h3>
            <div className="grid gap-1">
              {(data?.recent ?? []).length === 0 && (
                <p className="text-[13px] text-[#6f6a90]">Nothing yet.</p>
              )}
              {(data?.recent ?? []).slice(0, 20).map((r, i) => (
                <p key={i} className="truncate text-[12px] text-[#a9a4c4]">
                  <span className="text-[#e8e5f5]">{r.type}</span>
                  {r.name ? ` · ${r.name}` : ""}
                  {r.section ? ` · ${r.section}` : ""}
                  {r.path ? ` · ${r.path}` : ""}
                  {r.at ? ` · ${new Date(r.at).toLocaleString()}` : ""}
                </p>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}


/* ----------------------------- power rankings ---------------------------- */

type WeekMeta = {
  week: number;
  weekLabel: string;
  season: string;
  publishedAt: string;
  matchCount: number;
};

type UploadResult = {
  week: number;
  weekLabel: string;
  season: string;
  teams: number;
  comparedWith: number | null;
  weeks: WeekMeta[];
};

/**
 * Publishing weeks of the power ranking table.
 *
 * The file is the Willow Predictor's "Export for website" download, uploaded
 * here unmodified. Each upload becomes one week; the home page grows a numbered
 * button per published week and the newest is what a visitor lands on. Deleting
 * every week is a supported state, not a broken one — the table falls back to
 * the week bundled into the site.
 */
function Rankings({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [weeks, setWeeks] = useState<WeekMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/power-rankings/weeks?site=${SITE}`);
      if (!res.ok) return;
      const json = (await res.json()) as { data?: WeekMeta[] };
      setWeeks(Array.isArray(json.data) ? json.data : []);
    } catch {
      /* informational panel — a failure here must not block the console */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      // Parsed here so a plainly broken file is rejected before it travels.
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(await file.text()) as Record<string, unknown>;
      } catch {
        throw new Error(`${file.name} is not valid JSON.`);
      }

      // The Predictor stamps its export for cplxch unless told otherwise, and
      // the service takes the destination site from the file. Without this, a
      // stock export uploaded here would publish to the wrong site — and
      // overwrite that site's week while doing it.
      payload.site = SITE;

      const res = await fetch(`${ANALYTICS_BASE}/power-rankings/admin/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        onExpired();
        return;
      }
      if (!res.ok) throw new Error(await readError(res, "Upload failed"));
      const json = (await res.json()) as { data?: UploadResult };
      const r = json.data;
      if (r) {
        setWeeks(r.weeks ?? []);
        setNotice(
          `Published ${r.weekLabel} (${r.season}) — ${r.teams} teams. ` +
            (r.comparedWith
              ? `Movement measured against week ${r.comparedWith}.`
              : "First week published, so every team shows as new.") +
            " The live site picks this up on its next load.",
        );
      } else {
        await load();
        setNotice("Published. The live site picks it up on its next load.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeWeek = async (week: number, season: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `${ANALYTICS_BASE}/power-rankings/admin/week/${week}?site=${SITE}&season=${encodeURIComponent(season)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(await readError(res, "Could not delete"));
      await load();
      setNotice(`Week ${week} removed. Its button is gone from the home page.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${ANALYTICS_BASE}/power-rankings/admin/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site: SITE }),
      });
      if (!res.ok) throw new Error(await readError(res, "Could not clear"));
      const json = (await res.json()) as { data?: { deleted?: number } };
      setWeeks([]);
      setConfirming(false);
      setNotice(
        `${json.data?.deleted ?? 0} published week(s) removed. The table has fallen back to the week built into the site.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-bold">Power rankings</h2>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-[#7c3aed] px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Working…" : "Add JSON"}
        </button>
        {weeks.length > 0 && (
          <button
            onClick={() => setConfirming(true)}
            disabled={busy}
            className="ml-auto rounded-lg border border-[#6b2436] px-3 py-1.5 text-[13px] font-semibold text-[#ff9db4] disabled:opacity-50"
          >
            Delete all weeks
          </button>
        )}
      </div>

      <p className="mt-1 max-w-[62ch] text-[13px] text-[#a9a4c4]">
        Upload the file the Willow Predictor produces with{" "}
        <span className="text-[#e8e5f5]">Export for website</span>. Each upload publishes one week
        of the table — its ranks, ratings, records, form, per-factor marks and write-ups. The home
        page shows a numbered button per week, and opens on the newest. Re-uploading a week you
        already published replaces it.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-[#7f1d3a] bg-[#2a1020] px-3 py-2 text-[13px] text-[#ff9db4]">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-lg border border-[#1e5f43] bg-[#0f2a20] px-3 py-2 text-[13px] text-[#8ee6b8]">
          {notice}
        </p>
      )}

      {/* Clearing every week changes what the public site shows, so it asks. */}
      {confirming && (
        <div className="mt-3 rounded-xl border border-[#6b2436] bg-[#241019] p-4">
          <p className="text-[15px] font-semibold text-white">Delete all {weeks.length} week(s)?</p>
          <p className="mt-1 text-[13px] text-[#e2b5c2]">
            The table falls back to the week built into the site, and every week button disappears
            until you upload again. Analytics, questions and images are not affected.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void clearAll()}
              disabled={busy}
              className="rounded-lg bg-[#b3243f] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Yes, delete every week
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-[#3a3557] px-3 py-2 text-[13px] font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={`mt-3 ${CARD}`}>
        {weeks.length === 0 ? (
          <p className="text-[13px] text-[#6f6a90]">
            Nothing published — the table is showing the week built into the site.
          </p>
        ) : (
          <div className="grid gap-1.5">
            {weeks.map((w) => (
              <div
                key={`${w.season}-${w.week}`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#241f3d] py-1.5 last:border-b-0"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#3a3557] text-[13px] font-bold tabular-nums text-white">
                  {String(w.week).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-[#e8e5f5]">
                    {w.weekLabel || `Week ${w.week}`}
                  </span>
                  <span className="block truncate text-[12px] text-[#6f6a90]">
                    {w.season} · {w.matchCount} matches · published{" "}
                    {new Date(w.publishedAt).toLocaleString()}
                  </span>
                </span>
                <button
                  onClick={() => void removeWeek(w.week, w.season)}
                  disabled={busy}
                  className="rounded-lg border border-[#4a3a55] px-3 py-1.5 text-[13px] font-semibold text-[#ff9db4] disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------- questions ------------------------------- */

const FIELD =
  "mt-1 w-full rounded-lg border border-[#3a3557] bg-[#16121f] px-3 py-2 text-[14px] text-white outline-none focus:border-[#8b5cf6]";

function Field({
  label,
  value,
  onChange,
  hint,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block text-[13px] font-medium text-[#cfcbe4]">
      {label}
      {textarea ? (
        <textarea value={value} rows={2} onChange={(e) => onChange(e.target.value)} className={FIELD} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} />
      )}
      {hint && <span className="mt-1 block text-[12px] font-normal text-[#6f6a90]">{hint}</span>}
    </label>
  );
}

/** Answer list. At least two are required — fewer is unanswerable. */
function Options({
  options,
  onChange,
}: {
  options: EditableOption[];
  onChange: (next: EditableOption[]) => void;
}) {
  const set = (i: number, label: string) =>
    onChange(options.map((o, n) => (n === i ? { ...o, label } : o)));

  return (
    <div>
      <p className="text-[13px] font-medium text-[#cfcbe4]">Answers</p>
      <div className="mt-1 grid gap-2">
        {options.map((o, i) => (
          <div key={o.id} className="flex items-center gap-2">
            <input
              value={o.label}
              onChange={(e) => set(i, e.target.value)}
              placeholder={`Answer ${i + 1}`}
              className="w-full rounded-lg border border-[#3a3557] bg-[#16121f] px-3 py-2 text-[14px] text-white outline-none focus:border-[#8b5cf6]"
            />
            <button
              type="button"
              disabled={options.length <= 2}
              onClick={() => onChange(options.filter((_, n) => n !== i))}
              title={options.length <= 2 ? "A question needs at least two answers" : "Remove"}
              className="shrink-0 rounded-lg border border-[#4a3a55] px-2.5 py-2 text-[13px] text-[#ff9db4] disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([...options, { id: `opt-${Date.now().toString(36)}`, label: "" }])
        }
        className="mt-2 rounded-lg border border-[#3a3557] px-3 py-1.5 text-[13px] font-semibold"
      >
        Add answer
      </button>
    </div>
  );
}

function Questions({
  token,
  items,
  onSaved,
  onExpired,
}: {
  token: string;
  items: ContentItem[];
  onSaved: (items: ContentItem[]) => void;
  onExpired: () => void;
}) {
  const [pred, setPred] = useState<EditablePrediction>(() => defaultPrediction());
  const [chal, setChal] = useState<EditableChallenge>(() => defaultChallenge());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Seed the forms from whatever is published, falling back to the bundled
  // question — so the editor always opens on exactly what the site is showing.
  useEffect(() => {
    setPred(predictionFrom(items));
    setChal(challengeFrom(items));
  }, [items]);

  const save = async (slot: "predictionQuestion" | "challengeQuestions", value: unknown) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${ANALYTICS_BASE}/sitecontent/admin/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site: SITE, slot, text: JSON.stringify(value) }),
      });
      if (res.status === 401) {
        onExpired();
        return;
      }
      if (!res.ok) throw new Error(await readError(res, "Save failed"));
      const json = (await res.json()) as { data?: ContentItem[] };
      if (Array.isArray(json.data)) onSaved(json.data);
      setNotice("Saved. The live site picks it up on its next load.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  /** Clearing the slot is how you get the bundled question back. */
  const revert = async (slot: "predictionQuestion" | "challengeQuestions") => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${ANALYTICS_BASE}/sitecontent/admin/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site: SITE, slot, text: "" }),
      });
      if (!res.ok) throw new Error(await readError(res, "Could not revert"));
      const json = (await res.json()) as { data?: ContentItem[] };
      if (Array.isArray(json.data)) onSaved(json.data);
      setPred(defaultPrediction());
      setChal(defaultChallenge());
      setNotice("Reverted to the shipped question.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revert");
    } finally {
      setBusy(false);
    }
  };

  const enoughAnswers = (o: EditableOption[]) => o.filter((x) => x.label.trim()).length >= 2;

  return (
    <section className="mt-7">
      <h2 className="text-[19px] font-bold">Questions</h2>
      <p className="mt-1 max-w-[62ch] text-[13px] text-[#a9a4c4]">
        The question text, the answers and the surrounding copy for the two interactive cards.
        Fixtures, teams and timings stay with the shipped record.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-[#7f1d3a] bg-[#2a1020] px-3 py-2 text-[13px] text-[#ff9db4]">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-lg border border-[#1e5f43] bg-[#0f2a20] px-3 py-2 text-[13px] text-[#8ee6b8]">
          {notice}
        </p>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className={CARD}>
          <h3 className="text-[15px] font-semibold">“Call it” — the prediction</h3>
          <div className="mt-3 grid gap-3">
            <Field label="Question" value={pred.question} onChange={(v) => setPred({ ...pred, question: v })} />
            <Options options={pred.options} onChange={(options) => setPred({ ...pred, options })} />
            <Field label="Strapline" value={pred.meta} onChange={(v) => setPred({ ...pred, meta: v })} />
            <Field
              label="Void rule"
              value={pred.edge_case_rule}
              onChange={(v) => setPred({ ...pred, edge_case_rule: v })}
              textarea
              hint="Shown under the answers — what happens if the match doesn't run."
            />
            <Field label="Follow-up line" value={pred.hook} onChange={(v) => setPred({ ...pred, hook: v })} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void save("predictionQuestion", pred)}
              disabled={busy || !pred.question.trim() || !enoughAnswers(pred.options)}
              className="rounded-lg bg-[#7c3aed] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              Save prediction
            </button>
            <button
              onClick={() => void revert("predictionQuestion")}
              disabled={busy}
              className="rounded-lg border border-[#3a3557] px-3 py-2 text-[13px] font-semibold disabled:opacity-40"
            >
              Revert to shipped
            </button>
          </div>
        </div>

        <div className={CARD}>
          <h3 className="text-[15px] font-semibold">“Back yourself” — the challenge</h3>
          <div className="mt-3 grid gap-3">
            <Field label="Question" value={chal.question} onChange={(v) => setChal({ ...chal, question: v })} />
            <Options options={chal.options} onChange={(options) => setChal({ ...chal, options })} />
            <Field label="Strapline" value={chal.meta} onChange={(v) => setChal({ ...chal, meta: v })} />
            <Field label="Closing line" value={chal.closeLine} onChange={(v) => setChal({ ...chal, closeLine: v })} />
            <Field
              label="Void rule"
              value={chal.edge_case_rule}
              onChange={(v) => setChal({ ...chal, edge_case_rule: v })}
              textarea
            />
            <label className="block text-[13px] font-medium text-[#cfcbe4]">
              Payout multiplier
              <input
                type="number"
                min={1}
                step={0.1}
                value={chal.payout_multiplier}
                onChange={(e) =>
                  setChal({ ...chal, payout_multiplier: Number(e.target.value) || 1 })
                }
                className={FIELD}
              />
            </label>
            <Field
              label="Stake chips"
              value={chal.stakes.join(", ")}
              onChange={(v) =>
                setChal({
                  ...chal,
                  stakes: v
                    .split(",")
                    .map((n) => Number(n.trim()))
                    .filter((n) => Number.isFinite(n) && n > 0),
                })
              }
              hint="Comma separated, e.g. 50, 100, 250."
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void save("challengeQuestions", [chal])}
              disabled={busy || !chal.question.trim() || !enoughAnswers(chal.options)}
              className="rounded-lg bg-[#7c3aed] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              Save challenge
            </button>
            <button
              onClick={() => void revert("challengeQuestions")}
              disabled={busy}
              className="rounded-lg border border-[#3a3557] px-3 py-2 text-[13px] font-semibold disabled:opacity-40"
            >
              Revert to shipped
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ upload card ------------------------------ */

function UploadRow({
  slot,
  label,
  labelName,
  current,
  bundled,
  altOptional,
  onUpload,
  onRemove,
  busy,
}: {
  slot: string;
  label?: string;
  labelName?: string;
  current: ContentItem | null;
  bundled?: string;
  altOptional?: boolean;
  onUpload: (file: File, alt: string, label?: string) => void;
  onRemove: (id: string) => void;
  busy: boolean;
}) {
  const [alt, setAlt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Whatever is actually on the site right now: the upload if there is one, the
  // bundled asset otherwise. Showing the bundled shot is the point — the admin
  // can see what they are replacing before they replace it.
  const preview = current?.src ? assetUrl(current.src) : bundled || "";

  return (
    <div className="rounded-xl border border-[#2e2a45] bg-[#191430] p-3">
      <div className="flex items-start gap-3">
        <div className="grid h-[92px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-lg border border-[#37325a] bg-[#100d1c]">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="px-1 text-center text-[11px] text-[#6f6a90]">No image</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-white">{labelName || "Image"}</p>
          <p className="mt-0.5 text-[12px] text-[#a9a4c4]">
            {current ? (
              <>
                Custom upload
                {current.originalName ? ` · ${current.originalName}` : ""}
                {current.bytes ? ` · ${(current.bytes / 1024).toFixed(0)} KB` : ""}
              </>
            ) : bundled ? (
              "Using the shipped image"
            ) : (
              "Nothing uploaded"
            )}
          </p>

          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder={altOptional ? "Alt text (optional — decorative)" : "Alt text (required)"}
            className="mt-2 w-full rounded-lg border border-[#3a3557] bg-[#16121f] px-2.5 py-1.5 text-[13px] text-white outline-none focus:border-[#8b5cf6]"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f, alt, label);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy || (!altOptional && !alt.trim())}
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-[#7c3aed] px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
              title={!altOptional && !alt.trim() ? "Add alt text first" : undefined}
            >
              {current ? "Replace" : "Upload"}
            </button>
            {current && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemove(current.id)}
                className="rounded-lg border border-[#4a3a55] px-3 py-1.5 text-[13px] font-semibold text-[#ff9db4] disabled:opacity-40"
              >
                Remove
              </button>
            )}
            <span className="text-[11px] text-[#6f6a90]">PNG, JPEG, WEBP, GIF or AVIF · max 3MB</span>
          </div>
        </div>
      </div>

      {/* Slot is carried for the caller; shown only when debugging is useful. */}
      <span className="sr-only">{slot}</span>
    </div>
  );
}

/* ------------------------------- dashboard ------------------------------- */

function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setToken(window.localStorage.getItem(TOKEN_KEY));
  }, []);

  const keepToken = (t: string) => {
    window.localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const signOut = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setItems([]);
  };

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${ANALYTICS_BASE}/sitecontent/admin/all?site=${SITE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // An expired token is the common case here, and silently showing an empty
      // console would look like "nothing uploaded" rather than "signed out".
      if (res.status === 401) {
        signOut();
        setError("Session expired — sign in again.");
        return;
      }
      if (!res.ok) throw new Error(await readError(res, "Could not load content"));
      const json = (await res.json()) as { data?: ContentItem[] };
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load content");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (slot: string, file: File, alt: string, label?: string) => {
    if (!token) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = new FormData();
      body.append("site", SITE);
      body.append("slot", slot);
      body.append("alt", alt);
      if (label) body.append("label", label);
      body.append("image", file);

      const res = await fetch(`${ANALYTICS_BASE}/sitecontent/admin/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error(await readError(res, "Upload failed"));
      const json = (await res.json()) as { data?: ContentItem[] };
      setItems(Array.isArray(json.data) ? json.data : []);
      setNotice(`${file.name} uploaded. The live site picks it up on its next load.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      // `site` is required: the service scopes the delete by it and falls back
      // to cplxch, so omitting it matches nothing and reports "no such item".
      const res = await fetch(`${ANALYTICS_BASE}/sitecontent/admin/${id}?site=${SITE}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await readError(res, "Could not remove"));
      const json = (await res.json()) as { data?: ContentItem[] };
      setItems(Array.isArray(json.data) ? json.data : []);
      setNotice("Removed. That slot has fallen back to the shipped image.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  };

  if (!token) return <Login onToken={keepToken} />;

  const forSlot = (slot: string) => items.filter((i) => i.slot === slot);
  const byLabel = (slot: string, label: string) =>
    forSlot(slot).find((i) => i.label?.toLowerCase() === label.toLowerCase()) ?? null;

  return (
    <div className="min-h-screen bg-[#141024] px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-[860px]">
        <header className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-[26px] font-bold">cpljoy admin</h1>
            <p className="mt-1 text-[14px] text-[#a9a4c4]">
              Traffic, questions and artwork for cpljoy.
            </p>
          </div>
          <button
            onClick={signOut}
            className="ml-auto rounded-lg border border-[#3a3557] px-3 py-2 text-[13px] font-semibold"
          >
            Sign out
          </button>
        </header>

        {error && (
          <p className="mt-4 rounded-lg border border-[#7f1d3a] bg-[#2a1020] px-3 py-2 text-[13px] text-[#ff9db4]">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-lg border border-[#1e5f43] bg-[#0f2a20] px-3 py-2 text-[13px] text-[#8ee6b8]">
            {notice}
          </p>
        )}

        <Analytics token={token} onExpired={signOut} />

        <Rankings token={token} onExpired={signOut} />

        <Questions
          token={token}
          items={items}
          onSaved={setItems}
          onExpired={signOut}
        />

        <h2 className="mt-8 text-[19px] font-bold">Images</h2>
        <p className="mt-1 max-w-[62ch] text-[13px] text-[#a9a4c4]">
          Uploads replace the shipped artwork; removing one puts the shipped image back.
        </p>

        {SLOTS.map((s) => {
          const uploaded = forSlot(s.slot);
          return (
            <section key={s.slot} className="mt-7">
              <h2 className="text-[19px] font-bold">{s.title}</h2>
              <p className="mt-1 max-w-[62ch] text-[13px] text-[#a9a4c4]">{s.blurb}</p>

              <div className="mt-3 grid gap-3">
                {s.labels
                  ? // Fixed members: one row per tab or card, always shown, so an
                    // empty slot still tells the admin what can go there.
                    s.labels.map((l) => (
                      <UploadRow
                        key={l.id}
                        slot={s.slot}
                        label={l.id}
                        labelName={l.name}
                        bundled={l.bundled}
                        current={byLabel(s.slot, l.id)}
                        altOptional={s.altOptional}
                        busy={busy}
                        onUpload={(f, alt, label) => void upload(s.slot, f, alt, label)}
                        onRemove={(id) => void remove(id)}
                      />
                    ))
                  : s.multi
                    ? // Free-form list: the uploads that exist, plus one empty row
                      // to add the next.
                      [
                        ...uploaded.map((i) => (
                          <UploadRow
                            key={i.id}
                            slot={s.slot}
                            labelName={i.alt || i.originalName || "Frame"}
                            current={i}
                            altOptional={s.altOptional}
                            busy={busy}
                            onUpload={(f, alt) => void upload(s.slot, f, alt)}
                            onRemove={(id) => void remove(id)}
                          />
                        )),
                        <UploadRow
                          key="new"
                          slot={s.slot}
                          labelName="Add a frame"
                          current={null}
                          altOptional={s.altOptional}
                          busy={busy}
                          onUpload={(f, alt) => void upload(s.slot, f, alt)}
                          onRemove={() => {}}
                        />,
                      ]
                    : [
                        <UploadRow
                          key={s.slot}
                          slot={s.slot}
                          labelName={s.title}
                          current={uploaded[0] ?? null}
                          altOptional={s.altOptional}
                          busy={busy}
                          onUpload={(f, alt) => void upload(s.slot, f, alt)}
                          onRemove={(id) => void remove(id)}
                        />,
                      ]}
              </div>
            </section>
          );
        })}

        <p className="mt-10 text-[12px] text-[#6f6a90]">
          Changes are live for anyone who loads the site after the upload finishes.
        </p>
      </div>
    </div>
  );
}
