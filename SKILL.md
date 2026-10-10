# Ontario Facility Emissions Spine

## What this skill gives you

A canonical identity spine between Ontario's two facility emissions registries for 2010-2024:

- **Ontario MECP** (Greenhouse Gas Emissions Reporting By Facility, Reg 390/18): 480 facility IDs, 420 reporting in 2024.
- **Federal GHGRP** (Emissions by Gas, ECCC): 491 Ontario facility IDs, 418 reporting in 2024.

The registries publish no shared facility key. This skill ships the spine: 458 anchored matches on exact normalized name plus same city (89.3% of 513 canonical facilities), 0 resolved (strict rules rejected every fuzzy near-miss), 55 honestly unmatched. 30,693 EWRB large-building rows are quarantined because the program publishes no building names or street addresses.

## When to use it

- "What are the top emitters in Ontario and how do the two programs' numbers compare?"
- "How much did facility X emit in 2024 according to Ontario vs the federal registry?"
- "Which landfills emit the most methane in Ontario?"
- "Show me the name history of a facility that changed names across years."
- "What year-over-year emission anomalies have been flagged?"

## How to query it

REST base: `{origin}/api/v1`

```
GET /api/v1/search?q=algoma&city=sault%20ste.%20marie&limit=5
GET /api/v1/facility/ONF-000042
GET /api/v1/stats
```

OpenAPI 3.1: `{origin}/api/openapi.json`

MCP (streamable HTTP): `POST {origin}/mcp` with JSON-RPC 2.0. Tools:

- `facility_lookup` (spine_id): full record: both programs' name histories, annual series, 2024 totals, program gap, EWRB context, methane and anomaly flags.
- `spine_search` (q, city, tier, program, limit): search the 513-facility spine.
- `match_stats`: tier statistics, top-30 emitters, EWRB quarantine, landfill methane ranking, 2024 agreement deltas.

## Reading a record

- `ontario_2024_t` / `ghgrp_2024_t`: 2024 totals in tonnes CO2e as published by each program.
- `delta_2024_t` / `delta_2024_pct`: Ontario minus federal. Note the biomass asymmetry: Ontario's published total includes biomass CO2, the federal total excludes it. Use `join.delta_t` (biomass-adjusted) for program-vs-program comparisons.
- `tier`: `anchored` (exact normalized name + same city) or `unmatched`. There is no fuzzy tier: resolved is 0 by design.
- `ontario_ghg_names` / `ghgrp_names`: full name histories per program (133 of 480 Ontario IDs changed names across years).
- `ewrb_context`: city-level manufacturing intensity, confidence `ecological`. Never present as the facility's own building intensity.
- `methane`: per-program methane rows for landfill-like facilities (tonnes CO2e, share of total).
- `anomalies`: year-over-year flags above 200% jumps or 75% drops on bases above 1,000 tonnes.

## Limits you must state

2024 is the latest vintage on all three sources. Both programs use a 10 kt CO2e reporting threshold, so small emitters are absent. Matching requires the same normalized city, so municipality renames can strand a match. The landfill registry join is a spec, not a computed join. Tonnes are reported totals, not health impact.

Author: Richardson Dackam. Not affiliated with the Government of Ontario or the MECP.
