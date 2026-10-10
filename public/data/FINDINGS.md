# Ontario Facility Emissions Spine: Findings

Built Oct 10, 2026 from three open datasets. Pipeline: `scripts/build_spine.py`, curated examples in `scripts/make_examples.py`.

## Sources

1. Ontario GHG by facility, 2010 to 2024, Ontario MECP under Reg 390/18. 4,231 rows, 480 unique facility IDs, 420 reporting in 2024. Downloaded from files.ontario.ca.
2. Federal GHGRP Emissions by Gas, 2004 to 2024, ECCC. 20,685 rows nationally, 4,606 for Ontario, 491 unique Ontario facility IDs, 418 reporting in 2024. The old static download URL now returns the data catalogue app shell, so the file was fetched through the catalogue API at data-donnees.az.ec.gc.ca/api/file. File date 2026-07-24.
3. EWRB large buildings, 2018 to 2024, Ontario Ministry of Energy and Mines. 30,693 rows, 9,250 buildings, English files only.

## Finding 1: the two emissions programs agree almost exactly, which validates the identity spine

458 of 513 canonical facilities (89.3 percent) anchored across the Ontario and federal programs on exact normalized name plus same city. 416 of the 458 merged facilities have 2024 totals in both programs. The largest absolute gap is 3,392 tonnes at Greenstone Mine (+2.2 percent). The largest percentage gap is +3.5 percent at Musselwhite Mine (1,105 tonnes). 55 facilities (10.7 percent) are unmatched: 22 appear only in the Ontario file, 33 only in the federal file, and nearly all of them stopped reporting before 2024, which means closures or years below the 10 kilotonne reporting threshold rather than matching failures.

The agreement is not luck. Both programs use the same 10 kilotonne threshold and reporters file nearly identical numbers to both. Ontario totals include biomass CO2 while the federal total excludes it, so the join subtracts biomass CO2 from the Ontario total before comparing. After that adjustment the deltas cluster near zero, which is independent corroboration that the 458 anchors pair the right facilities. The spine's value is identity, not new totals: it lets one query follow a plant across both registries and 20 years of history.

Three merge traps were found and defused during development. "Canada Brick - Aldershot" versus "Hanson Brick - Aldershot" are different companies whose shared token is the city name itself. "BUNGE CANADA - HAMILTON" versus "Hamilton" fails the same way. Two Ingredion plants in Cardinal and Port Colborne share a company name but are different facilities. All three are now blocked by rules: a site suffix that equals the city can never anchor a merge, and conflicting site suffixes veto the merge. Two federal facilities in Woodstock share the name "Woodstock Plant", so anchored full-name matches are assigned before sub-form matches: the Ontario record (Federal White Cement, 373,834 tonnes) paired with G10114 (Federal White Cement, 373,477 tonnes, 0.1 percent apart) instead of the Lafarge plant (220,315 tonnes).

## Finding 2: EWRB cannot join at building level, and 11.4 percent of its rows are implausible

The EWRB files publish no building names and no street addresses, only city and a 3-character postal code, so no EWRB row can be resolved to a named facility. All 30,693 rows are quarantined. Of those, 3,002 rows (9.8 percent) report zero energy or GHG intensity and 508 rows report GHG intensity above 1,000 kgCO2e per m2 against a dataset median of 25.9. The worst row claims 2,861,043 kgCO2e per m2 for a Brampton distribution centre, a physical impossibility consistent with a unit or floor-area entry error. The ministry's own warning that the data is not cleansed is borne out by the numbers.

Because a record-level join is impossible, the pipeline attaches city-level context instead: for 49 cities with enough manufacturing-plant records, the median weather-normalized site energy intensity and GHG intensity across anonymized EWRB manufacturing plants. 96 matched industrial facilities carry this context, flagged as ecological rather than building-level. This is a ceiling on what the dataset can support, not a gap in the pipeline.

## Finding 3: landfills dominate facility methane, and both programs report the same numbers

89 landfill-like facilities were identified by NAICS 56221 or name. Methane is 90 to 100 percent of their reported totals. The top methane emitter is Essex-Windsor Regional Landfill at 332,600 tonnes CO2e of methane in 2024 (99.2 percent of its total), followed by Twin Creeks Landfill at 320,601 tonnes (99.1 percent) and Keele Valley Landfill at 222,895 tonnes. The same methane figures appear in both programs for matched landfills, which is expected since reporters file one set of numbers twice. A join spec for the provincial landfill registry is in `joins/landfill_methane.json`, but the registry itself was not part of this build, so no registry-side join was computed.

## Supporting outputs

- `spine.json` / `spine.csv`: 513 canonical facilities with per-program name variants, 2024 totals, annual series, and EWRB context where attached. 515 KB, full, no row cap needed.
- `top_emitters.json`: top 30 Ontario 2024 emitters. Algoma Steel leads at 4,226.7 kt, then ArcelorMittal Dofasco at 4,165.9 kt, then the Lake Erie generating station at 3,770.0 kt.
- `joins/ghg_vs_ghgrp.json`: all 416 matched 2024 pairs with deltas, plus top absolute and percentage deltas.
- `joins/ewrb_joined.json`: 49 city manufacturing-intensity contexts and the 25 largest emitters carrying them.
- `joins/merges.json`: all 458 merges with ratios and the raw name pairs.
- `anomalies.json`: 128 year-over-year flags (jumps above 200 percent or drops above 75 percent on bases over 1,000 tonnes). Largest: Rainy River Mine 2018 to 2019, 4,660 to 146,180 tonnes (+3,037 percent), a mine ramping up, verified against the raw file.
- `examples.json`: 9 curated cases, 5 clean merges with name-variant histories and 4 correctly rejected near-misses.
- `stats.json`, `match_funnel.json`: tier and coverage counts.

## Honest limits

- Matching requires the same normalized city, so a facility whose municipality is recorded differently in the two programs will not merge. 22 Ontario-only and 33 federal-only facilities remain unmatched, nearly all non-2024 reporters.
- The fuzzy tier (difflib at 0.90 or above) produced zero merges after the strict rules, so the funnel shows resolved at 0. Near-misses like "Hamilton Specialty Bar (2007) Inc." versus "Hamilton Specialty Bar Corporation" (ratio 0.75) were left unmatched rather than guessed.
- 133 of 480 Ontario facility IDs changed names across years. The spine keeps every historical name as a variant, but the match itself uses the latest names.
- EWRB context is city-level and ecological. It must not be presented as a building's own intensity.
- The landfill registry join is a spec, not a computed join. No registry file was downloaded.
- Ontario's "Total CO2e from all sources" includes biomass CO2 and the federal total excludes it. The join adjusts for this. Any reuse of the raw totals must apply the same adjustment.
