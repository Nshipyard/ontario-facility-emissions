import { NextResponse } from "next/server";
import { getData } from "@/lib/spine";

export async function GET() {
  const { stats, funnel, topEmitters, join, spine, methane, ewrb } = getData();
  const unmatched = spine.filter((f) => f.tier === "unmatched");
  const unmatched_detail = {
    ontario_only: unmatched.filter((f) => f.programs.includes("ontario_ghg") && !f.programs.includes("federal_ghgrp")).length,
    federal_only: unmatched.filter((f) => f.programs.includes("federal_ghgrp") && !f.programs.includes("ontario_ghg")).length,
  };
  // Dedupe the methane ranking by facility name (both programs file the same numbers)
  const seen = new Set<string>();
  const landfill_top = methane.methane_ranking_2024
    .filter((m) => { if (seen.has(m.name)) return false; seen.add(m.name); return true; })
    .slice(0, 10);
  const ewrb_cities = Object.entries(ewrb.city_context)
    .map(([city, c]) => ({ city, n_buildings: c.n_buildings, median_ghg_kgco2e_m2: c.median_ghg_kgco2e_m2 }))
    .sort((a, b) => b.n_buildings - a.n_buildings)
    .slice(0, 8);
  return NextResponse.json({
    stats,
    match_funnel: funnel,
    unmatched_detail,
    top_emitters: topEmitters,
    ewrb_quarantine: stats.ewrb.quarantine_reasons,
    ewrb_cities,
    landfill_top,
    agreement_2024: {
      n_matched_with_2024_both: join.n_matched_with_2024_both,
      note: join.note,
      top_abs_deltas: join.top_abs_deltas.slice(0, 8),
      top_pct_deltas: join.top_pct_deltas.slice(0, 8),
    },
  });
}
