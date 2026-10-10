"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";

interface Hit {
  spine_id: string;
  canonical_name: string;
  city: string;
  tier: string;
  programs: string[];
  ontario_2024_t: number | null;
  ghgrp_2024_t: number | null;
}

interface Detail extends Hit {
  ontario_ghg_id: number | null;
  ontario_ghg_names: string[];
  ghgrp_id: string | null;
  ghgrp_names: string[];
  ontario_series: Record<string, number>;
  ghgrp_series: Record<string, number>;
  ewrb_context: {
    city: string;
    n_buildings: number;
    median_wn_site_eui_gj_m2: number;
    median_ghg_kgco2e_m2: number;
    confidence: string;
  } | null;
  methane: { program: string; facility_id: string; name: string; total_2024_t: number; ch4_2024_co2e_t: number; ch4_share_pct: number }[];
  anomalies: { program: string; year_from: number; year_to: number; prev_t: number; curr_t: number; pct_change: number }[];
  join: { delta_t: number; delta_pct: number; ontario_2024_adj_t: number | null } | null;
  delta_2024_t: number | null;
  delta_2024_pct: number | null;
}

function tonnes(n: number | null) {
  if (n == null) return "–";
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M t`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K t`;
  return `${Math.round(n)} t`;
}

function SeriesChart({ d, oLabel, fLabel }: { d: Detail; oLabel: string; fLabel: string }) {
  const W = 680, H = 220, P = 36;
  const years = Array.from(new Set([...Object.keys(d.ontario_series), ...Object.keys(d.ghgrp_series)])).sort();
  const vals = years.flatMap((y) => [d.ontario_series[y], d.ghgrp_series[y]]).filter((v) => v != null);
  if (years.length < 2 || vals.length === 0) return null;
  const max = Math.max(...vals) * 1.05;
  const x = (i: number) => P + (i / (years.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const path = (series: Record<string, number>, color: string) => {
    const pts = years.map((yr, i) => (series[yr] != null ? `${x(i).toFixed(1)},${y(series[yr]).toFixed(1)}` : null)).filter(Boolean);
    if (pts.length < 2) return null;
    return <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" />;
  };
  return (
    <div className="mt-4 overflow-hidden rounded-[20px] border border-line bg-paper-warm p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={d.canonical_name}>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={P} y1={H - P - f * (H - 2 * P)} x2={W - P} y2={H - P - f * (H - 2 * P)} stroke="rgba(10,15,30,0.08)" strokeWidth="1" />
        ))}
        {path(d.ontario_series, "#d80621")}
        {path(d.ghgrp_series, "#1a3a6b")}
        <text x={P} y={H - 8} fontSize="11" fill="rgba(10,15,30,0.5)">{years[0]}</text>
        <text x={W - P} y={H - 8} fontSize="11" fill="rgba(10,15,30,0.5)" textAnchor="end">{years[years.length - 1]}</text>
        <text x={P} y={P - 8} fontSize="11" fill="rgba(10,15,30,0.5)">{tonnes(max / 1.05)}</text>
      </svg>
      <div className="flex flex-wrap gap-x-6 gap-y-1 px-2 pb-2 text-[13px] text-ink/60">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-canada" />{oLabel}</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#1a3a6b]" />{fLabel}</span>
      </div>
    </div>
  );
}

export default function Explorer() {
  const { t, lang } = useLang();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [tier, setTier] = useState("");
  const [program, setProgram] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function run(query: string, c: string, tr: string, pr: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, city: c, tier: tr, program: pr, limit: "40" });
      const res = await fetch(`/api/v1/search?${params}`);
      const data = await res.json();
      setHits(data.hits ?? []);
      setTotal(data.total ?? 0);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function openFacility(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/v1/facility/${encodeURIComponent(id)}`);
      const data = await res.json();
      setDetail(data.spine_id ? data : null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => run(q, city, tier, program), 300);
    return () => clearTimeout(id);
  }, [q, city, tier, program]);

  const e = t.explorer;
  const locale = lang === "fr" ? "fr-CA" : "en-CA";

  if (detail || detailLoading) {
    return (
      <div>
        <button
          onClick={() => setDetail(null)}
          className="mb-6 rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold hover:border-ink"
        >
          ← {e.back}
        </button>
        {detailLoading && <p className="text-[15px] text-ink/55">…</p>}
        {detail && (
          <article className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
            <p className="font-mono text-[12px] uppercase tracking-wide text-ink/45">
              {e.idLabel} {detail.spine_id}
              {detail.ontario_ghg_id != null ? ` · Ontario ${detail.ontario_ghg_id}` : ""}
              {detail.ghgrp_id ? ` · GHGRP ${detail.ghgrp_id}` : ""}
            </p>
            <h3 className="display mt-2 text-[30px] md:text-[38px]">{detail.canonical_name}</h3>
            <p className="mt-1 text-[15px] text-ink/60">{detail.city}, Ontario</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-ink/5 px-3.5 py-1.5 text-[13px] font-medium">
                {detail.tier === "anchored" ? e.anchored : e.unmatched}
              </span>
              <span className="rounded-full bg-ink/5 px-3.5 py-1.5 text-[13px]">
                {detail.programs.includes("ontario_ghg") && detail.programs.includes("federal_ghgrp")
                  ? e.both
                  : detail.programs.includes("ontario_ghg") ? e.ontarioOnly : e.federalOnly}
              </span>
            </div>
            <div className="mt-6 grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-3">
              {[
                { v: tonnes(detail.ontario_2024_t), l: e.ontarioTotal },
                { v: tonnes(detail.ghgrp_2024_t), l: e.federalTotal },
                {
                  v: detail.delta_2024_t == null ? "–" : `${detail.delta_2024_t >= 0 ? "+" : ""}${detail.delta_2024_t.toLocaleString(locale, { maximumFractionDigits: 0 })} t`,
                  l: e.gap,
                },
              ].map((s) => (
                <div key={s.l} className="bg-paper-warm p-5">
                  <p className="display text-[30px] text-canada">{s.v}</p>
                  <p className="mt-1 text-[13px] text-ink/60">{s.l}</p>
                </div>
              ))}
            </div>

            <h4 className="display mt-8 text-[22px]">{e.series}</h4>
            <SeriesChart d={detail} oLabel={e.seriesOntario} fLabel={e.seriesFederal} />

            <h4 className="display mt-8 text-[22px]">{e.variants}</h4>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-line bg-paper-warm p-5">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">{e.ontarioNames}</p>
                <ul className="mt-2 space-y-1.5 text-[14px] text-ink/75">
                  {detail.ontario_ghg_names.length > 0
                    ? detail.ontario_ghg_names.map((n) => <li key={n}>{n}</li>)
                    : <li className="text-ink/45">–</li>}
                </ul>
              </div>
              <div className="rounded-[20px] border border-line bg-paper-warm p-5">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">{e.federalNames}</p>
                <ul className="mt-2 space-y-1.5 text-[14px] text-ink/75">
                  {detail.ghgrp_names.length > 0
                    ? detail.ghgrp_names.map((n) => <li key={n}>{n}</li>)
                    : <li className="text-ink/45">–</li>}
                </ul>
              </div>
            </div>

            {detail.ewrb_context && (
              <div className="mt-6 rounded-[20px] border border-line bg-paper-warm p-5 md:p-6">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">{e.ewrb}</p>
                <p className="display mt-2 text-[28px] text-canada">
                  {detail.ewrb_context.n_buildings.toLocaleString(locale)}{" "}
                  <span className="text-[18px] text-ink/55">{e.ewrbBuildings}</span>
                </p>
                <p className="mt-2 text-[14px] text-ink/65">
                  {e.ewrbMedian}: {detail.ewrb_context.median_ghg_kgco2e_m2.toLocaleString(locale)} kgCO2e/m2 · {detail.ewrb_context.median_wn_site_eui_gj_m2.toLocaleString(locale)} GJ/m2 ({detail.ewrb_context.city})
                </p>
                <p className="mt-2 text-[13px] text-ink/50">{e.ewrbNote}</p>
              </div>
            )}

            {detail.methane.length > 0 && (
              <div className="mt-6 rounded-[20px] border border-line bg-paper-warm p-5 md:p-6">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">{e.methane}</p>
                {detail.methane.map((m) => (
                  <p key={`${m.program}:${m.facility_id}`} className="mt-2 text-[14px] text-ink/65">
                    {tonnes(m.ch4_2024_co2e_t)} · {m.ch4_share_pct.toLocaleString(locale)}% {e.ch4Share}
                    <span className="text-ink/45"> ({m.program})</span>
                  </p>
                ))}
              </div>
            )}

            {detail.anomalies.length > 0 && (
              <div className="mt-6 rounded-[20px] border border-line bg-paper-warm p-5 md:p-6">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">{e.anomalies}</p>
                <ul className="mt-2 space-y-1.5 text-[14px] text-ink/65">
                  {detail.anomalies.map((a, i) => (
                    <li key={i}>
                      {a.year_from} → {a.year_to}: {tonnes(a.prev_t)} → {tonnes(a.curr_t)} ({a.pct_change >= 0 ? "+" : ""}{a.pct_change.toLocaleString(locale, { maximumFractionDigits: 1 })}%)
                      <span className="text-ink/45"> · {a.program}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
          placeholder={e.search}
          className="w-full flex-1 rounded-full border border-line bg-paper px-6 py-3.5 text-[16px] outline-none placeholder:text-ink/35 focus:border-canada"
          aria-label={e.search}
        />
        <input
          value={city}
          onChange={(ev) => setCity(ev.target.value)}
          placeholder={e.city}
          className="w-full rounded-full border border-line bg-paper px-6 py-3.5 text-[16px] outline-none placeholder:text-ink/35 focus:border-canada md:w-44"
          aria-label={e.city}
        />
        <div className="flex gap-3">
          <select
            value={tier}
            onChange={(ev) => setTier(ev.target.value)}
            className="rounded-full border border-line bg-paper px-5 py-3.5 text-[15px] outline-none focus:border-canada"
            aria-label={e.tier}
          >
            <option value="">{e.allTiers}</option>
            <option value="anchored">{e.anchored}</option>
            <option value="unmatched">{e.unmatched}</option>
          </select>
          <select
            value={program}
            onChange={(ev) => setProgram(ev.target.value)}
            className="rounded-full border border-line bg-paper px-5 py-3.5 text-[15px] outline-none focus:border-canada"
            aria-label={e.program}
          >
            <option value="">{e.allPrograms}</option>
            <option value="both">{e.both}</option>
            <option value="ontario_only">{e.ontarioOnly}</option>
            <option value="federal_only">{e.federalOnly}</option>
          </select>
        </div>
      </div>
      <div className="mt-8">
        {!searched && !loading && <p className="max-w-[640px] text-[15px] leading-relaxed text-ink/55">{e.empty}</p>}
        {loading && <p className="text-[15px] text-ink/55">…</p>}
        {searched && !loading && hits.length === 0 && <p className="text-[15px] text-ink/55">{e.noResult}</p>}
        {hits.length > 0 && (
          <>
            <p className="mb-4 text-[14px] text-ink/55">
              {e.showing} {hits.length} {e.of} {total.toLocaleString(locale)}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {hits.map((h) => (
                <button
                  key={h.spine_id}
                  onClick={() => openFacility(h.spine_id)}
                  className="rounded-[24px] border border-line bg-paper p-6 text-left transition-colors hover:border-canada"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[16px] font-semibold leading-snug">{h.canonical_name}</p>
                    <p className="shrink-0 font-mono text-[11px] text-ink/40">{h.spine_id}</p>
                  </div>
                  <p className="mt-1 text-[13px] text-ink/55">{h.city}, Ontario</p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                    <p className="display text-[28px] text-canada">{tonnes(h.ontario_2024_t ?? h.ghgrp_2024_t)}</p>
                    <p className="text-[14px] text-ink/60">
                      {h.ghgrp_2024_t != null && h.ontario_2024_t != null
                        ? `${tonnes(h.ghgrp_2024_t)} ${e.federalTotal.split(",")[0]}`
                        : ""}
                    </p>
                  </div>
                  <p className="mt-2 text-[12px] text-ink/45">
                    {h.tier === "anchored" ? e.anchored : e.unmatched} ·{" "}
                    {h.programs.includes("ontario_ghg") && h.programs.includes("federal_ghgrp")
                      ? e.both
                      : h.programs.includes("ontario_ghg") ? e.ontarioOnly : e.federalOnly}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
