"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";

interface TopEmitter { rank: number; spine_id: string; name: string; city: string; kt_co2e_2024: number; ghgrp_2024_t: number }
interface Delta { spine_id: string; name: string; o_city: string; f_city: string; ontario_2024_adj_t: number; ghgrp_2024_t: number; delta_t: number; delta_pct: number }
interface Methane { name: string; city: string; total_2024_t: number; ch4_2024_co2e_t: number; ch4_share_pct: number }
interface EwrbCity { city: string; n_buildings: number; median_ghg_kgco2e_m2: number }

interface Summary {
  stats: {
    spine_rows: number;
    tiers: { anchored: number; resolved: number; unmatched: number };
    programs: { ontario_ghg: number; federal_ghgrp: number };
    ewrb: { rows: number; buildings: number; quarantined_rows: number; quarantine_reasons: { no_building_identifier: number; zero_intensity: number; absurd_ghg_intensity: number } };
  };
  unmatched_detail: { ontario_only: number; federal_only: number };
  top_emitters: TopEmitter[];
  ewrb_quarantine: { no_building_identifier: number; zero_intensity: number; absurd_ghg_intensity: number };
  ewrb_cities: EwrbCity[];
  landfill_top: Methane[];
  agreement_2024: { n_matched_with_2024_both: number; top_abs_deltas: Delta[]; top_pct_deltas: Delta[] };
}

interface Pt { spine_id: string; name: string; city: string; tier: string; lat: number; lon: number; t: number }

// Ontario projection (same constants as src/lib/spine.ts)
const LON0 = -96, LON1 = -73.5, LAT0 = 41.5, LAT1 = 57, W = 620, H = 560;
function project(lon: number, lat: number): [number, number] | null {
  if (!isFinite(lon) || !isFinite(lat)) return null;
  if (lon < LON0 || lon > LON1 || lat < LAT0 || lat > LAT1) return null;
  const x = ((lon - LON0) / (LON1 - LON0)) * W;
  const y = H - ((lat - LAT0) / (LAT1 - LAT0)) * H;
  return [x, y];
}

// Approximate Ontario boundary (lon, lat), hand-authored, light fill only.
const ONTARIO_OUTLINE: [number, number][] = [
  [-95.1, 52.0], [-94.8, 54.5], [-92.5, 55.5], [-89.5, 56.8], [-86.5, 55.5], [-84.0, 55.0],
  [-82.0, 55.0], [-80.8, 54.0], [-79.8, 52.5], [-79.2, 51.2], [-78.5, 50.5], [-77.5, 49.8],
  [-76.5, 49.0], [-75.0, 47.5], [-74.7, 45.5], [-74.5, 45.0], [-76.0, 44.0], [-77.5, 43.6],
  [-79.1, 43.3], [-79.8, 43.0], [-80.5, 42.9], [-81.8, 42.5], [-82.6, 42.0], [-83.1, 42.3],
  [-82.7, 42.6], [-82.4, 42.9], [-82.4, 43.6], [-82.6, 43.5], [-82.8, 44.5], [-83.5, 45.5],
  [-84.3, 46.0], [-84.6, 46.5], [-85.5, 47.0], [-87.0, 47.5], [-88.0, 48.0], [-88.9, 48.3],
  [-88.5, 48.4], [-89.5, 48.5], [-90.5, 48.3], [-91.6, 48.7], [-92.8, 49.0], [-94.0, 49.3],
  [-94.6, 49.7], [-95.2, 49.3], [-95.1, 50.5],
];

function hashJitter(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return [((h % 13) - 6), (((h >> 4) % 13) - 6)];
}

function fmtT(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

function Funnel({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const max = Math.sqrt(Math.max(...rows.map((r) => r.value), 1));
  return (
    <div className="mt-8 space-y-4 md:space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="md:flex md:items-center md:gap-4">
          <p className="mb-1.5 text-[13px] font-medium text-ink/70 md:mb-0 md:w-64 md:shrink-0 md:text-right md:text-[14px]">{r.label}</p>
          <div className="h-9 min-w-0 md:h-11 md:flex-1">
            <div
              className="flex h-full items-center justify-end rounded-r-[12px] pr-3"
              style={{ width: `${Math.max((Math.sqrt(Math.max(r.value, 0.0001)) / max) * 100, 1.5)}%`, background: r.color }}
            >
              <span className="font-mono text-[13px] font-semibold text-white">{r.value.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Showcase() {
  const { t, lang } = useLang();
  const [s, setS] = useState<Summary | null>(null);
  const [pts, setPts] = useState<Pt[]>([]);
  const [cite, setCite] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/stats").then((r) => r.json()).then(setS);
    fetch("/api/v1/facility/points").then((r) => r.json()).then((d) => setPts(d.points ?? []));
  }, []);

  const dots = useMemo(() => {
    return pts.map((p) => {
      const xy = project(p.lon, p.lat);
      if (!xy) return null;
      const [jx, jy] = hashJitter(p.spine_id);
      const r = Math.min(10, 2 + (Math.log10(p.t + 1) / 6.7) * 8);
      return {
        x: xy[0] + jx, y: xy[1] + jy, r,
        color: p.tier === "anchored" ? "#d80621" : "#1a3a6b",
        name: p.name, city: p.city,
      };
    }).filter(Boolean) as { x: number; y: number; r: number; color: string; name: string; city: string }[];
  }, [pts]);

  const outlinePath = useMemo(() => {
    const ps = ONTARIO_OUTLINE.map(([lo, la]) => project(lo, la)).filter(Boolean) as [number, number][];
    return `M${ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")} Z`;
  }, []);

  function copyCite(id: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCite(id);
    setTimeout(() => setCite(null), 1800);
  }

  if (!s) return null;
  const sc = t.showcase;
  const st = s.stats;
  const locale = lang === "fr" ? "fr-CA" : "en-CA";

  const funnelRows = [
    { label: sc.sOntarioIds, value: st.programs.ontario_ghg, color: "#1a3a6b" },
    { label: sc.sFederalIds, value: st.programs.federal_ghgrp, color: "#1a3a6b" },
    { label: sc.sSpine, value: st.spine_rows, color: "#d80621" },
    { label: sc.sAnchored, value: st.tiers.anchored, color: "#d80621" },
    { label: sc.sResolved, value: st.tiers.resolved, color: "#7a8499" },
    { label: sc.sUnmatched, value: st.tiers.unmatched, color: "#1a3a6b" },
    { label: sc.sQuarantined, value: st.ewrb.quarantined_rows, color: "rgba(10,15,30,0.35)" },
  ];

  const top15 = s.top_emitters.slice(0, 15);
  const maxKt = Math.max(...top15.map((e) => e.kt_co2e_2024));

  const q = s.ewrb_quarantine;
  const qRows = [
    { label: sc.ewrbNoId, value: q.no_building_identifier, color: "#1a3a6b" },
    { label: sc.ewrbZero, value: q.zero_intensity, color: "#d80621" },
    { label: sc.ewrbAbsurd, value: q.absurd_ghg_intensity, color: "#d80621" },
  ];
  const qMax = Math.max(...qRows.map((r) => r.value));

  const citeBtn = (id: string, text: string) => (
    <button
      onClick={() => copyCite(id, text)}
      className="rounded-full border border-line px-5 py-2 text-[14px] font-semibold hover:border-ink"
    >
      {cite === id ? sc.copied : sc.citeThis}
    </button>
  );

  return (
    <section id="showcase" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{sc.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{sc.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{sc.body}</p>

        {/* Funnel */}
        <h3 className="display mt-16 text-[28px] md:text-[34px]">{sc.funnelTitle}</h3>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink/60">{sc.funnelSub}</p>
        <Funnel rows={funnelRows} />
        <p className="mt-6 max-w-[720px] text-[15px] leading-relaxed text-ink/60">{sc.unmatchedNote}</p>
        <p className="mt-2 max-w-[720px] text-[15px] leading-relaxed text-ink/60">{sc.resolvedNote}</p>

        {/* Map */}
        <h3 className="display mt-20 text-[28px] md:text-[34px]">{sc.mapTitle}</h3>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink/60">{sc.mapSub}</p>
        <div className="mt-8 overflow-hidden rounded-[24px] border border-line bg-paper-warm">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={sc.mapTitle}>
            <path d={outlinePath} fill="rgba(10,15,30,0.045)" stroke="rgba(10,15,30,0.18)" strokeWidth="1.2" />
            {dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={0.68}>
                <title>{`${d.name} (${d.city})`}</title>
              </circle>
            ))}
          </svg>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line px-6 py-4 text-[13px] text-ink/60">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#d80621]" />{sc.legendAnchored}</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#1a3a6b]" />{sc.legendUnmatched}</span>
            <span className="ml-auto basis-full text-[12px] text-ink/45 md:basis-auto">{sc.mapFoot}</span>
          </div>
        </div>

        {/* Ranking */}
        <h3 className="display mt-20 text-[28px] md:text-[34px]">{sc.rankingTitle}</h3>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink/60">{sc.rankingSub}</p>
        <div className="mt-8 space-y-4">
          {top15.map((e, i) => (
            <div key={e.spine_id} className="rounded-[24px] border border-line bg-paper-warm p-5 md:p-6">
              <p className="text-[15px] font-semibold leading-snug">
                <span className="mr-2 font-mono text-[13px] text-ink/40">{i + 1}</span>
                {e.name}
                <span className="ml-2 font-normal text-ink/50">{e.city}</span>
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium text-ink/60">{sc.ontarioLabel}</span>
                    <span className="font-mono font-semibold text-canada-dark">{e.kt_co2e_2024.toLocaleString(locale)} kt</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ink/5">
                    <div className="h-full rounded-full bg-canada" style={{ width: `${(e.kt_co2e_2024 / maxKt) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium text-ink/60">{sc.federalLabel}</span>
                    <span className="font-mono font-semibold text-[#1a3a6b]">{(e.ghgrp_2024_t / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })} kt</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ink/5">
                    <div className="h-full rounded-full bg-[#1a3a6b]" style={{ width: `${(e.ghgrp_2024_t / 1000 / maxKt) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[720px] text-[15px] leading-relaxed text-ink/60">{sc.biomassNote}</p>

        {/* Agreement join */}
        <h3 className="display mt-20 text-[28px] md:text-[34px]">{sc.agreeTitle}</h3>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink/60">{sc.agreeBody}</p>
        <div className="mt-4 flex justify-end">{citeBtn("agree", sc.citeAgreement)}</div>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <h4 className="text-[16px] font-semibold">{sc.agreeAbs}</h4>
            <div className="mt-4 space-y-2.5">
              {s.agreement_2024.top_abs_deltas.map((d) => (
                <div key={d.spine_id} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[14px] font-medium">{d.name} <span className="font-normal text-ink/45">· {d.o_city}</span></p>
                      <p className="shrink-0 font-mono text-[13px] font-semibold text-canada-dark">+{fmtT(Math.abs(d.delta_t))} t</p>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink/5">
                      <div className="h-full rounded-full bg-canada" style={{ width: `${(Math.abs(d.delta_t) / 3392.4) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[16px] font-semibold">{sc.agreePct}</h4>
            <div className="mt-4 space-y-2.5">
              {s.agreement_2024.top_pct_deltas.map((d) => (
                <div key={d.spine_id} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[14px] font-medium">{d.name} <span className="font-normal text-ink/45">· {d.o_city}</span></p>
                      <p className="shrink-0 font-mono text-[13px] font-semibold text-[#1a3a6b]">+{d.delta_pct.toLocaleString(locale, { maximumFractionDigits: 1 })}%</p>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink/5">
                      <div className="h-full rounded-full bg-[#1a3a6b]" style={{ width: `${(d.delta_pct / 3.5) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* EWRB join */}
        <h3 className="display mt-20 text-[28px] md:text-[34px]">{sc.ewrbTitle}</h3>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink/60">{sc.ewrbBody}</p>
        <div className="mt-4 flex justify-end">{citeBtn("ewrb", sc.citeEwrb)}</div>
        <h4 className="mt-6 text-[16px] font-semibold">{sc.ewrbQuarantine}</h4>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          {qRows.map((r) => (
            <div key={r.label} className="rounded-[24px] border border-line bg-paper-warm p-6">
              <p className="display text-[36px]" style={{ color: r.color === "rgba(10,15,30,0.35)" ? "#0a0f1e" : r.color }}>
                {r.value.toLocaleString(locale)}
              </p>
              <p className="mt-1 text-[13px] text-ink/55">{r.label}</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/5">
                <div className="h-full rounded-full" style={{ width: `${(r.value / qMax) * 100}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
        <h4 className="mt-12 text-[16px] font-semibold">{sc.ewrbContextTitle}</h4>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink/60">{sc.ewrbContextBody}</p>
        <div className="mt-6 overflow-x-auto rounded-[24px] border border-line">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead>
              <tr className="bg-paper-warm text-[13px] uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 font-medium">{sc.ewrbCity}</th>
                <th className="px-5 py-3 text-right font-medium">{sc.ewrbBuildings}</th>
                <th className="px-5 py-3 text-right font-medium">{sc.ewrbMedianGhg}</th>
              </tr>
            </thead>
            <tbody>
              {s.ewrb_cities.map((c) => (
                <tr key={c.city} className="border-t border-line">
                  <td className="px-5 py-3 font-medium">{c.city}</td>
                  <td className="px-5 py-3 text-right font-mono">{c.n_buildings.toLocaleString(locale)}</td>
                  <td className="px-5 py-3 text-right font-mono">{c.median_ghg_kgco2e_m2.toLocaleString(locale, { maximumFractionDigits: 1 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Landfill join */}
        <h3 className="display mt-20 text-[28px] md:text-[34px]">{sc.landfillTitle}</h3>
        <p className="mt-2 max-w-[720px] text-[15px] text-ink/60">{sc.landfillBody}</p>
        <div className="mt-4 flex justify-end">{citeBtn("landfill", sc.citeLandfill)}</div>
        <h4 className="mt-6 text-[16px] font-semibold">{sc.landfillBars}</h4>
        <div className="mt-4 space-y-3">
          {s.landfill_top.map((m, i) => (
            <div key={m.name} className="flex items-center gap-4">
              <span className="w-7 shrink-0 font-mono text-[13px] text-ink/40">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[15px] font-medium">{m.name} <span className="font-normal text-ink/45">· {m.city}</span></p>
                  <p className="shrink-0 font-mono text-[13px] font-semibold text-canada-dark">
                    {m.ch4_2024_co2e_t.toLocaleString(locale, { maximumFractionDigits: 0 })} <span className="text-ink/50">({m.ch4_share_pct.toLocaleString(locale, { maximumFractionDigits: 1 })}%)</span>
                  </p>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-ink/5">
                  <div className="h-full rounded-full bg-canada" style={{ width: `${(m.ch4_2024_co2e_t / 332599.8) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[720px] text-[15px] leading-relaxed text-ink/60">{sc.landfillNote}</p>
      </div>
    </section>
  );
}
