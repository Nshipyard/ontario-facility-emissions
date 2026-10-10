"use client";

import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/search?q=algoma&limit=3",
    desc: "Search facilities by name, city, program presence, and match tier",
    response: `{
  "q": "algoma",
  "total": 2,
  "hits": [
    {
      "spine_id": "ONF-000042",
      "canonical_name": "Algoma Steel Inc",
      "city": "Sault Ste. Marie",
      "tier": "anchored",
      "programs": ["ontario_ghg", "federal_ghgrp"],
      "ontario_2024_t": 4226732,
      "ghgrp_2024_t": 4226731.318
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/facility/ONF-000042",
    desc: "Full record: both programs' name histories, annual series, 2024 totals, delta, EWRB context, methane and anomaly flags",
    response: `{
  "spine_id": "ONF-000042",
  "canonical_name": "Algoma Steel Inc",
  "tier": "anchored",
  "ontario_2024_t": 4226732,
  "ghgrp_2024_t": 4226731.318,
  "delta_2024_t": 0.68,
  "ewrb_context": null,
  "methane": [],
  "anomalies": []
}`,
  },
  {
    method: "GET",
    path: "/api/v1/stats",
    desc: "Match statistics, funnel, unmatched split, top-30 emitters, EWRB quarantine, landfill methane, 2024 agreement deltas",
    response: `{ "stats": { "spine_rows": 513,
    "tiers": { "anchored": 458, "resolved": 0, "unmatched": 55 }, … },
  "top_emitters": [ … ],
  "agreement_2024": { "n_matched_with_2024_both": 416, … } }`,
  },
];

export default function Developers() {
  const { t } = useLang();
  return (
    <section id="developers" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.developers.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-white/70">{t.developers.body}</p>

        <h3 className="mt-14 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.endpoints}</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {endpoints.map((e) => (
            <article key={e.path} className="flex min-w-0 flex-col rounded-[24px] border border-white/15 bg-white/5 p-6">
              <p className="font-mono text-[12px] font-semibold text-white/60">{e.method}</p>
              <code className="mt-1 break-all font-mono text-[13px] text-white">{e.path}</code>
              <p className="mt-2 text-[14px] text-white/65">{e.desc}</p>
              <pre className="mt-4 flex-1 overflow-x-auto rounded-[16px] bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-white/80">
                {e.response}
              </pre>
              <a
                href={e.path}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block self-start rounded-full border border-white/25 px-5 py-2 text-[14px] font-semibold hover:border-white"
              >
                {t.developers.tryIt} →
              </a>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/openapi.json" target="_blank" rel="noreferrer" className="block rounded-[24px] bg-white/[0.06] p-6 hover:bg-white/[0.09]">
            <h4 className="text-[19px] font-semibold">{t.developers.openapi}</h4>
            <code className="mt-2 block font-mono text-[13px] text-white/60">GET /api/openapi.json</code>
          </a>
        </div>

        <McpConnect
          config={{
            slug: "ontario-emissions-spine",
            displayName: "Ontario Facility Emissions Spine",
            exampleEn: 'Look up the facility with the highest 2024 emissions and show me its program-vs-program delta',
            exampleFr: 'Trouve l’installation aux plus fortes émissions 2024 et montre-moi son écart entre programmes',
          }}
        />
      </div>
    </section>
  );
}
