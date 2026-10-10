#!/usr/bin/env python3
"""Build examples.json: instructive entity-resolution cases with real numbers."""
import json, difflib, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data"
spine = json.load(open(OUT / "spine.json"))
merges = json.load(open(OUT / "joins" / "merges.json"))
by_o = {m["ontario_ghg_id"]: m for m in merges}

def nn(s):
    s = str(s).upper()
    s = re.sub(r"[^\w\s]", " ", s)
    toks = [t for t in s.split()]
    suf = {"INC","INCORPORATED","LTD","LIMITED","CORP","CORPORATION","CO","COMPANY",
           "LP","LLP","LLC","ULC"}
    while toks and toks[-1].rstrip(".") in suf:
        toks.pop()
    return " ".join(toks)

def ratio(a, b):
    return round(difflib.SequenceMatcher(None, nn(a), nn(b)).ratio(), 3)

examples = []

def anchored_case(spine_id, note):
    r = next(x for x in spine if x["spine_id"] == spine_id)
    m = by_o[r["ontario_ghg_id"]]
    examples.append(dict(
        kind="merged", tier="anchored", ratio=m["ratio"], note=note,
        ontario_variants=r["ontario_ghg_names"], ghgrp_variants=r["ghgrp_names"],
        city=r["city"], spine_id=spine_id))

# 1. rename across years, same plant
r_am = next(x for x in spine if x["canonical_name"] == "ArcelorMittal Dofasco")
anchored_case(r_am["spine_id"], "Ownership rebrand visible in both programs' histories: Dofasco became ArcelorMittal Dofasco. The 2024 names match exactly, and the spine preserves the old names as variants.")
# 2. acquisition rename
r_eb = next(x for x in spine if x["canonical_name"] == "Emerald Energy from Waste Inc.")
anchored_case(r_eb["spine_id"], "Acquisition rename: Algonquin Power's energy-from-waste plant became Emerald. Both programs recorded the old and new names in different years.")
# 3. legal suffix
r_bb = next(x for x in spine if x["canonical_name"] == "Brampton Brick Limited")
anchored_case(r_bb["spine_id"], "Legal-suffix normalization: 'Brampton Brick' vs 'Brampton Brick Limited' normalize to the same key; the raw variants are kept on the record.")
# 4. site descriptor added
r_nb = next(x for x in spine if x["canonical_name"] == "North Bay Power Plant")
anchored_case(r_nb["spine_id"], "Descriptor drift: reported as 'North Bay' in some years and 'North Bay Power Plant' in others. The 2024 names agree, variants retained.")
# 5. Inc dropped
r_bp = next(x for x in spine if x["canonical_name"] == "Bruce Power")
anchored_case(r_bp["spine_id"], "'Bruce Power Inc' vs 'Bruce Power': trailing legal token stripped by normalization, exact match on what remains.")

# 6. rejected: same city plant name, different companies
examples.append(dict(
    kind="rejected", tier="unmatched",
    ontario_variant="Canada Brick - Aldershot", ghgrp_variant="Hanson Brick - Aldershot",
    city="Aldershot", raw_name_ratio=ratio("Canada Brick - Aldershot", "Hanson Brick - Aldershot"),
    note="NOT merged. Full-name ratio is only 0.76, and the shared token 'Aldershot' is the city name itself, so it cannot serve as a plant identifier. Different owners (Brampton Brick vs Hanson/Heidelberg) reporting plants in the same city."))
# 7. rejected: site suffix is the city name
examples.append(dict(
    kind="rejected", tier="unmatched",
    ontario_variant="BUNGE CANADA - HAMILTON", ghgrp_variant="Hamilton",
    city="Hamilton", raw_name_ratio=ratio("BUNGE CANADA - HAMILTON", "Hamilton"),
    note="NOT merged. The Ontario name's site portion is just 'Hamilton', which is also the city, so there is no plant-level evidence they are the same facility. Full-name ratio is 0.52. Left unmatched rather than guessed."))
# 8. rejected: same company, different plants
examples.append(dict(
    kind="rejected", tier="unmatched",
    ontario_variant="Ingredion Canada Corporation", ghgrp_variant="Ingredion Canada Incorporated - Port Colborne Plant",
    city_o="Cardinal", city_f="Port Colborne", raw_name_ratio=ratio("Ingredion Canada Corporation", "Ingredion Canada Incorporated - Port Colborne Plant"),
    note="NOT merged. Same company, different plants in different cities (Cardinal vs Port Colborne). The site-suffix veto blocks cross-plant merges even when the company name matches."))
# 9. tie-break: two-pass assignment
m = by_o[1045]
s1045 = next(x for x in spine if x["ontario_ghg_id"] == 1045)
examples.append(dict(
    kind="merged", tier="anchored", ratio=m["ratio"], spine_id=s1045["spine_id"],
    ontario_variant="Woodstock Plant", ghgrp_variant="Woodstock Plant",
    city="Woodstock",
    ontario_2024_t=373834, ghgrp_2024_t=373477,
    note="Tie-break done right. Two federal facilities in Woodstock share the name 'Woodstock Plant': G10114 (Federal White Cement, 373,477 t in 2024) and G10172 (Lafarge, 220,315 t). Anchored full-name matches are assigned before sub-form matches, so the Ontario record (owner Federal White Cement, 373,834 t) paired with G10114. Emissions agree to 0.1 percent, confirming the choice."))

json.dump(examples, open(OUT / "examples.json", "w"), indent=1, ensure_ascii=False)
print(f"wrote {len(examples)} examples")
