import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Ontario Facility Emissions Spine API",
    version: "1.0.0",
    description:
      "Ontario's MECP greenhouse gas registry and the federal GHGRP name the same facilities differently and share no published key. This API serves the open identity spine linking 513 canonical Ontario facilities across both programs for 2010-2024: 458 anchored matches on exact normalized name plus same city, 55 honestly unmatched, 0 resolved (strict rules, near-misses rejected on purpose), and 30,693 EWRB large-building rows quarantined because the program publishes no building names or street addresses. The largest 2024 program-vs-program gap after biomass adjustment is 3,392 tonnes at Greenstone Mine (+2.2%). Sources: Ontario MECP Greenhouse Gas Emissions Reporting By Facility (2010-2024), Ontario Ministry of Energy and Mines large-building energy and water usage files (2018-2024), and ECCC GHGRP Emissions by Gas (2004-2024). Source data under the Ontario Open Government Licence and the federal Open Government Licence - Canada. Derived tables MIT licensed.",
  },
  servers: [{ url: "https://emissions.canada.nshipyard.com/api/v1" }],
  paths: {
    "/spine": {
      get: {
        summary: "Full spine: 513 canonical facilities with per-program name variants, 2024 totals, annual series, and EWRB context",
        responses: { "200": { description: "Count plus the full facility array" } },
      },
    },
    "/search": {
      get: {
        summary: "Search facilities by name, city, program presence, and match tier, ranked by 2024 emissions",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, example: "Algoma" },
          { name: "city", in: "query", required: false, schema: { type: "string" }, example: "Hamilton" },
          { name: "tier", in: "query", required: false, schema: { type: "string", enum: ["anchored", "unmatched"] } },
          {
            name: "program",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["both", "ontario_only", "federal_only"] },
            description: "both: present in the Ontario and federal programs; ontario_only / federal_only: present in one program",
          },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50, maximum: 200 } },
        ],
        responses: { "200": { description: "Total plus matched facility records with 2024 totals from both programs" } },
      },
    },
    "/stats": {
      get: {
        summary: "Match statistics, identity-resolution funnel, top-30 emitter ranking, and 2024 program-vs-program agreement",
        responses: { "200": { description: "Stats, funnel, top emitters, and agreement deltas" } },
      },
    },
    "/facility/{id}": {
      get: {
        summary: "Full record for one canonical facility: both programs' name histories, annual series, 2024 totals, delta, EWRB context, methane and anomaly flags",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, example: "ONF-000042" },
        ],
        responses: { "200": { description: "Facility record" }, "404": { description: "No facility with that spine_id" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
