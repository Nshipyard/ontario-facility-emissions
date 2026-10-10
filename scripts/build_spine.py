#!/usr/bin/env python3
"""Ontario Facility Emissions Spine: entity resolution across three programs.

Programs:
  ontario_ghg : Ontario MECP GHG by facility, Reg 390/18 (2010-2024)
  federal_ghgrp : ECCC GHGRP Emissions by Gas, Ontario facilities (2004-2024)
  ewrb : Ontario Energy and Water Reporting and Benchmarking (2018-2024, anonymized)

Outputs go to ../public/data/. All numbers are real, computed from raw downloads.
"""
import json, re, math, difflib
from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw"
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "joins").mkdir(exist_ok=True)

LEGAL_SUFFIX = {"INC","INCORPORATED","LTD","LIMITED","CORP","CORPORATION","CO","COMPANY",
                "LP","LTD.","LLP","LLC","ULC","SENC","SEC","S.E.C.","L.P.","GMBH","AG","SA",
                "PLC","TRUST","FUND","HOLDINGS","GROUP","CANADA","ONTARIO"}
STREET_MAP = {"ST":"SAINT","STE":"SAINTE","MT":"MOUNT","FT":"FORT","N":"NORTH","S":"SOUTH",
              "E":"EAST","W":"WEST","TWP":"TOWNSHIP","TWNSHP":"TOWNSHIP"}

def norm_name(s):
    if s is None or (isinstance(s,float) and math.isnan(s)):
        return ""
    s = str(s).upper()
    s = s.replace("&"," AND ")
    s = re.sub(r"[^\w\s]", " ", s)
    toks = [t for t in s.split() if t]
    while toks and toks[-1].rstrip(".") in LEGAL_SUFFIX:
        toks.pop()
    return " ".join(toks)

def norm_city(s):
    if s is None or (isinstance(s,float) and math.isnan(s)):
        return ""
    s = str(s).upper().strip()
    s = re.sub(r"[^\w\s]", " ", s)
    toks = [STREET_MAP.get(t, t) for t in s.split()]
    return " ".join(toks)

def fsa(postal):
    if postal is None or (isinstance(postal,float) and math.isnan(postal)):
        return ""
    p = re.sub(r"[^A-Z0-9]", "", str(postal).upper())
    return p[:3]

def to_num(x):
    if x is None or (isinstance(x,float) and math.isnan(x)):
        return None
    if isinstance(x,str):
        x = x.replace(",","").strip()
        if x in ("","-","N/A","NA","Not Available"): return None
    try:
        v = float(x)
    except (ValueError, TypeError):
        return None
    return v if not math.isnan(v) else None

def name_forms(raw):
    """Multiple matchable forms of a facility name."""
    n = norm_name(raw)
    forms = [n]
    for sep in [" - ", " – ", " — "]:
        if sep in raw:
            parts = [p.strip() for p in raw.split(sep)]
            forms.append(norm_name(parts[-1]))   # site portion
            forms.append(norm_name(parts[0]))    # company portion
    dash = re.split(r"\s*-\s*", str(raw))
    if len(dash) > 1:
        forms.append(norm_name(dash[-1]))
    return [f for f in dict.fromkeys(forms) if f]

# ---------------------------------------------------------------- load Ontario
print("loading Ontario GHG...")
og = pd.read_csv(RAW/"GHG_Data_2010_2024.csv", encoding="cp1252")
GAS_TOTAL = "Total CO2e from all sources in CO2e (t)"
BIO = "Carbon dioxide (CO2) from biomass in CO2e (t)"
CH4C = "Methane (CH4) in CO2e (t)"
og["total_t"] = og[GAS_TOTAL].apply(to_num)
og["bio_t"] = og[BIO].apply(to_num).fillna(0)
og["ch4_t"] = og[CH4C].apply(to_num).fillna(0)
og["adj_total_t"] = og["total_t"] - og["bio_t"]   # comparable to GHGRP total (excl CO2bio)

ont_fac = {}
for gid, grp in og.groupby("Ontario GHG ID"):
    grp = grp.sort_values("Year")
    last = grp.iloc[-1]
    names = sorted(set(str(x) for x in grp["Facility Name"].dropna()))
    ont_fac[gid] = dict(
        id=gid, names=names, latest_name=str(last["Facility Name"]),
        city=str(last["Facility City"]), naics=str(last["Facility Primary NAICS Code"]),
        years=sorted(int(y) for y in grp["Year"].unique()),
        latest_year=int(last["Year"]),
        series={int(r.Year): (to_num(r.total_t), to_num(r.adj_total_t), to_num(r.ch4_t))
                for r in grp.itertuples()},
    )
print(f"  Ontario GHG: {len(ont_fac)} unique facilities, {len(og)} rows")

# ---------------------------------------------------------------- load GHGRP
print("loading GHGRP...")
fg = pd.read_csv(RAW/"ghgrp_emissions_by_gas.csv", encoding="utf-8-sig", low_memory=False)
fg.columns = [c.split(" / ")[0] for c in fg.columns]
fg = fg[fg["Facility Province or Territory"] == "Ontario"].copy()
TOT = next(c for c in fg.columns if c.startswith("Total Emissions (tonnes CO2e)"))
ch4col = next(c for c in fg.columns if c.startswith("CH4 (tonnes CO2e"))
fg["total_t"] = fg[TOT].apply(to_num)
fg["ch4_t"] = fg[ch4col].apply(to_num).fillna(0)

fed_fac = {}
for gid, grp in fg.groupby("GHGRP ID No."):
    grp = grp.sort_values("Reference Year")
    last = grp.iloc[-1]
    names = sorted(set(str(x) for x in grp["Facility Name"].dropna()))
    fed_fac[gid] = dict(
        id=gid, names=names, latest_name=str(last["Facility Name"]),
        city=str(last["Facility City or District or Municipality"]),
        postal=str(last["Facility Postal Code"]) if pd.notna(last["Facility Postal Code"]) else "",
        naics=str(last["Facility NAICS Code"]) if pd.notna(last["Facility NAICS Code"]) else "",
        npri=str(last["Facility NPRI ID"]) if pd.notna(last["Facility NPRI ID"]) else "",
        lat=to_num(last["Latitude"]), lon=to_num(last["Longitude"]),
        company=str(last["Reporting Company Legal Name"]) if pd.notna(last["Reporting Company Legal Name"]) else "",
        years=sorted(int(y) for y in grp["Reference Year"].unique()),
        latest_year=int(last["Reference Year"]),
        series={int(r[1]): (to_num(r[2]), to_num(r[3]))
                for r in grp[["Reference Year","total_t","ch4_t"]].itertuples()},
    )
print(f"  GHGRP Ontario: {len(fed_fac)} unique facilities, {len(fg)} rows")

# ------------------------------------------------- entity resolution
print("entity resolution...")
o_ids = list(ont_fac)
f_ids = list(fed_fac)
o_norm = {i: (name_forms(ont_fac[i]["latest_name"]), norm_city(ont_fac[i]["city"])) for i in o_ids}
f_norm = {i: (name_forms(fed_fac[i]["latest_name"]), norm_city(fed_fac[i]["city"]), fsa(fed_fac[i]["postal"])) for i in f_ids}

# blocking: same normalized city, or same first token of primary name form
from collections import defaultdict
city_block_o = defaultdict(set); city_block_f = defaultdict(set)
tok_block_o = defaultdict(set);  tok_block_f = defaultdict(set)
for i in o_ids:
    city_block_o[o_norm[i][1]].add(i)
    if o_norm[i][0] and o_norm[i][0][0].split():
        tok_block_o[o_norm[i][0][0].split()[0]].add(i)
for i in f_ids:
    city_block_f[f_norm[i][1]].add(i)
    if f_norm[i][0] and f_norm[i][0][0].split():
        tok_block_f[f_norm[i][0][0].split()[0]].add(i)

def site_suffix(raw):
    s = str(raw)
    for sep in [" - ", " \u2013 ", " \u2014 "]:
        if sep in s:
            return norm_name(s.split(sep)[-1])
    d = re.split(r"\s*-\s*", s)
    return norm_name(d[-1]) if len(d) > 1 else ""

merges = []   # (ratio, tier, o_id, f_id, detail)
for oi in o_ids:
    onames, ocity = o_norm[oi]
    o_raw = ont_fac[oi]["latest_name"]
    o_site = site_suffix(o_raw)
    cand = city_block_f.get(ocity, set())   # same normalized city required
    for fi in cand:
        fnames, fcity, ffsa = f_norm[fi]
        if ocity != fcity:
            continue
        f_raw = fed_fac[fi]["latest_name"]
        f_site = site_suffix(f_raw)
        # veto: both records name a site/plant and the site names are unrelated
        if o_site and f_site and o_site != f_site \
           and o_site not in f_site and f_site not in o_site \
           and not (set(o_site.split()) & set(f_site.split())):
            continue
        full_o, full_f = onames[0], fnames[0]
        best_full = difflib.SequenceMatcher(None, full_o, full_f).ratio()
        best, best_pair = 0.0, None
        for a in onames:
            if not a:
                continue
            for b in fnames:
                if not b:
                    continue
                r = difflib.SequenceMatcher(None, a, b).ratio()
                if r > best:
                    best, best_pair = r, (a, b)
        # veto: a match that only works because one side's form is the bare
        # city name (e.g. site suffix "HAMILTON" matching facility "Hamilton")
        a, b = best_pair or ("", "")
        bare_city_pair = (a in (ocity, fcity) or b in (ocity, fcity)) \
            and not (a == full_o and b == full_f)
        if best_full == 1.0:
            tier = "anchored"
            ratio = 1.0
        elif best >= 0.90 and not bare_city_pair:
            tier = "resolved"
            ratio = best
        else:
            continue
        merges.append((ratio, tier, oi, fi,
                       dict(ratio=round(ratio,4), o_name=o_raw, f_name=f_raw,
                            o_city=ont_fac[oi]["city"], f_city=fed_fac[fi]["city"],
                            pair=list(best_pair) if best_pair else None)))

# greedy one-to-one, anchored pass first so full-name exact matches always
# beat sub-form matches on ties (e.g. two "Woodstock Plant" facilities)
final = []
used_o, used_f = set(), set()
for want_tier in ("anchored", "resolved"):
    cands = sorted([m for m in merges if m[1] == want_tier], key=lambda m: -m[0])
    for ratio, tier, oi, fi, det in cands:
        if oi in used_o or fi in used_f:
            continue
        used_o.add(oi); used_f.add(fi)
        final.append((ratio, tier, int(oi), str(fi), det))
print(f"  merges: {len(final)} ({sum(1 for m in final if m[1]=='anchored')} anchored, "
      f"{sum(1 for m in final if m[1]=='resolved')} resolved)")

# ---------------------------------------------------------------- build spine
spine = []
n = 0
match_lookup = {oi: (tier, fi, ratio) for ratio, tier, oi, fi, _ in final}
for oi in o_ids:
    n += 1
    o = ont_fac[oi]
    rec = dict(
        spine_id=f"ONF-{n:06d}",
        canonical_name=o["latest_name"],
        city=o["city"],
        tier=None, programs=["ontario_ghg"],
        ontario_ghg_id=int(oi),
        ontario_ghg_names=o["names"],
        ghgrp_id=None, ghgrp_names=[], ghgrp_city=None, ghgrp_postal=None, ghgrp_npri=None,
        ontario_2024_t=None, ghgrp_2024_t=None,
        ontario_series={str(y): v[0] for y, v in o["series"].items()},
        ghgrp_series={},
        ewrb_context=None,
    )
    if 2024 in o["series"]:
        rec["ontario_2024_t"] = o["series"][2024][0]
    if oi in match_lookup:
        tier, fi, ratio = match_lookup[oi]
        f = fed_fac[fi]
        rec["tier"] = tier
        rec["programs"] = ["ontario_ghg", "federal_ghgrp"]
        rec["ghgrp_id"] = fi
        rec["ghgrp_names"] = f["names"]
        rec["ghgrp_city"] = f["city"]
        rec["ghgrp_postal"] = f["postal"]
        rec["ghgrp_npri"] = f["npri"]
        rec["ghgrp_series"] = {str(y): v[0] for y, v in f["series"].items()}
        rec["match_ratio"] = round(ratio, 4)
        if 2024 in f["series"]:
            rec["ghgrp_2024_t"] = f["series"][2024][0]
    else:
        rec["tier"] = "unmatched"
    spine.append(rec)

used_f_all = {fi for _, _, _, fi, _ in final}
for fi_raw in f_ids:
    fi = str(fi_raw)
    if fi in used_f_all:
        continue
    n += 1
    f = fed_fac[fi_raw]
    rec = dict(
        spine_id=f"ONF-{n:06d}",
        canonical_name=f["latest_name"],
        city=f["city"],
        tier="unmatched", programs=["federal_ghgrp"],
        ontario_ghg_id=None, ontario_ghg_names=[],
        ghgrp_id=fi, ghgrp_names=f["names"], ghgrp_city=f["city"],
        ghgrp_postal=f["postal"], ghgrp_npri=f["npri"],
        ontario_2024_t=None,
        ghgrp_2024_t=f["series"][2024][0] if 2024 in f["series"] else None,
        ontario_series={},
        ghgrp_series={str(y): v[0] for y, v in f["series"].items()},
        ewrb_context=None,
    )
    spine.append(rec)
print(f"  spine rows: {len(spine)}")

# ---------------------------------------------------------------- EWRB
print("loading EWRB...")
ew = []
for y in range(2018, 2025):
    d = pd.read_excel(RAW/f"ewrb_{y}.xlsx", sheet_name=0)
    d["report_year"] = y
    ew.append(d)
ew = pd.concat(ew, ignore_index=True)
for c in ["Site_EUI1","WN_Site_EUI1","GHG_Emiss_Int1","GHG_Emiss_Int2","Site_EUI2"]:
    ew[c] = ew[c].apply(to_num)
print(f"  EWRB rows: {len(ew)}, buildings: {ew['EWRB_ID'].nunique()}")

# quarantine coding
reasons = []
for r in ew.itertuples():
    rs = ["no_building_identifier"]  # program publishes no name or address
    if (r.Site_EUI1 or 0) <= 0 or (r.GHG_Emiss_Int1 or 0) <= 0:
        rs.append("zero_intensity")
    if (r.GHG_Emiss_Int1 or 0) > 1000:
        rs.append("absurd_ghg_intensity")
    reasons.append(rs)
ew["quarantine_reasons"] = reasons
dup = ew.duplicated(subset=["EWRB_ID","report_year"], keep=False)
for i in ew.index[dup]:
    if "duplicate_record" not in ew.at[i,"quarantine_reasons"]:
        ew.at[i,"quarantine_reasons"].append("duplicate_record")

from collections import Counter
q_counts = Counter()
for rs in ew["quarantine_reasons"]:
    for x in rs: q_counts[x] += 1
print("  quarantine reason counts:", dict(q_counts))

# city-level manufacturing intensity context (ecological, not building-level)
mfg = ew[(ew["PrimPropTypCalc"]=="Manufacturing/Industrial Plant") & (ew["report_year"]==2024)]
city_ctx = {}
for city, grp in mfg.groupby("City"):
    vals_e = grp["WN_Site_EUI1"].dropna(); vals_g = grp["GHG_Emiss_Int1"].dropna()
    if len(vals_e) == 0: continue
    city_ctx[city] = dict(
        n_buildings=int(len(grp)),
        median_wn_site_eui_gj_m2=round(float(vals_e.median()),3),
        p10_wn_site_eui=round(float(vals_e.quantile(0.1)),3),
        p90_wn_site_eui=round(float(vals_e.quantile(0.9)),3),
        median_ghg_kgco2e_m2=round(float(vals_g.median()),2),
        confidence="ecological",
        note="City median across anonymized EWRB manufacturing plants. No building-level join possible.",
    )
# attach to matched industrial facilities (NAICS 31-33) in cities with context
IND = {f"31{i:02d}"[:2] for i in range(0,100)}
attached = 0
for rec in spine:
    if rec["tier"] not in ("anchored","resolved"): continue
    naics = None
    for cand in [ont_fac.get(rec["ontario_ghg_id"] or -1,{}).get("naics",""),
                 str(rec.get("ghgrp_id") and fed_fac[rec["ghgrp_id"]]["naics"] or "")]:
        if cand and str(cand)[:2] in ("31","32","33"):
            naics = cand; break
    ctx = city_ctx.get(rec["city"])
    if naics and ctx:
        rec["ewrb_context"] = dict(city=rec["city"], **ctx)
        if "ewrb" not in rec["programs"]:
            rec["programs"].append("ewrb")
        attached += 1
print(f"  EWRB city contexts: {len(city_ctx)} cities, attached to {attached} facilities")

# ---------------------------------------------------------------- anomalies
print("anomalies...")
anoms = []
def scan_anoms(series_dict, label, fac_id, fac_name, min_prev=1000.0):
    ys = sorted(series_dict)
    for a, b in zip(ys, ys[1:]):
        prev, curr = series_dict[a], series_dict[b]
        if prev is None or curr is None or prev < min_prev:
            continue
        ratio = curr/prev if prev else None
        if ratio is None: continue
        if ratio >= 3.0 or ratio <= 0.25:
            anoms.append(dict(program=label, facility_id=str(fac_id), facility_name=fac_name,
                              year_from=a, year_to=b, prev_t=round(prev,1), curr_t=round(curr,1),
                              pct_change=round((curr-prev)/prev*100,1)))
for oi, o in ont_fac.items():
    scan_anoms({y: v[0] for y, v in o["series"].items()}, "ontario_ghg", oi, o["latest_name"])
for fi, f in fed_fac.items():
    scan_anoms({y: v[0] for y, v in f["series"].items()}, "federal_ghgrp", fi, f["latest_name"])
print(f"  anomalies: {len(anoms)}")

# ---------------------------------------------------------------- outputs
def dump(obj, path):
    with open(path, "w") as fh:
        json.dump(obj, fh, indent=1, ensure_ascii=False)

# spine
for rec in spine:
    rec["programs"] = sorted(rec["programs"])
dump(spine, OUT/"spine.json")
sp = pd.DataFrame([dict(
    spine_id=r["spine_id"], canonical_name=r["canonical_name"], city=r["city"], tier=r["tier"],
    programs="|".join(r["programs"]), ontario_ghg_id=r["ontario_ghg_id"], ghgrp_id=r["ghgrp_id"],
    ontario_2024_t=r["ontario_2024_t"], ghgrp_2024_t=r["ghgrp_2024_t"],
    ewrb_city=(r["ewrb_context"] or {}).get("city") if r["ewrb_context"] else None,
) for r in spine])
sp.to_csv(OUT/"spine.csv", index=False)

# stats + funnel
tiers = Counter(r["tier"] for r in spine)
prog3 = sum(1 for r in spine if len(r["programs"])==3)
prog2 = sum(1 for r in spine if len(r["programs"])==2)
prog1 = sum(1 for r in spine if len(r["programs"])==1)
stats = dict(
    spine_rows=len(spine),
    tiers={k: tiers[k] for k in ("anchored","resolved","unmatched","quarantined")},
    programs=dict(ontario_ghg=sum(1 for r in spine if "ontario_ghg" in r["programs"]),
                  federal_ghgrp=sum(1 for r in spine if "federal_ghgrp" in r["programs"]),
                  ewrb_context=sum(1 for r in spine if "ewrb" in r["programs"])),
    coverage=dict(all_3_programs=prog3, two_programs=prog2, one_program=prog1),
    merges=dict(total=len(final), anchored=sum(1 for m in final if m[1]=="anchored"),
                resolved=sum(1 for m in final if m[1]=="resolved")),
    ewrb=dict(rows=len(ew), buildings=int(ew["EWRB_ID"].nunique()),
              years=[2018,2019,2020,2021,2022,2023,2024],
              quarantined_rows=len(ew), quarantine_reasons=dict(q_counts)),
    anomalies=len(anoms),
    merge_log="public/data/joins/merges.json",
)
dump(stats, OUT/"stats.json")
dump(dict(funnel=[dict(tier=k, count=tiers[k]) for k in ("anchored","resolved","unmatched","quarantined")],
          note="quarantined tier applies to EWRB building records (no building identifier published); "
               "facility spine rows are anchored/resolved/unmatched only."),
     OUT/"match_funnel.json")

# merges log
log = []
for ra, t, oi, fi, d in final:
    e = dict(d)
    e.update(tier=t, ratio=round(ra,4), ontario_ghg_id=int(oi), ghgrp_id=str(fi))
    log.append(e)
dump(log, OUT/"joins"/"merges.json")

# top emitters (Ontario GHG 2024)
top = sorted([r for r in spine if r["ontario_2024_t"]],
             key=lambda r: -r["ontario_2024_t"])[:30]
dump([dict(rank=i+1, spine_id=r["spine_id"], name=r["canonical_name"], city=r["city"],
           kt_co2e_2024=round(r["ontario_2024_t"]/1000,1), tier=r["tier"],
           ghgrp_2024_t=r["ghgrp_2024_t"]) for i, r in enumerate(top)], OUT/"top_emitters.json")

# join (a): ontario vs federal 2024 for matched facilities
oa = og[og["Year"]==2024].set_index("Ontario GHG ID")
fa = fg[fg["Reference Year"]==2024].set_index("GHGRP ID No.")
rows = []
def first_row(df, idx):
    r = df.loc[idx]
    if isinstance(r, pd.DataFrame):
        r = r.iloc[0]
    return r
for ra, t, oi, fi, d in final:
    if oi not in oa.index or fi not in fa.index: continue
    o_row, f_row = first_row(oa, oi), first_row(fa, fi)
    o_adj = to_num(o_row["adj_total_t"]); f_tot = to_num(f_row["total_t"])
    if o_adj is None or f_tot is None: continue
    delta = o_adj - f_tot
    rows.append(dict(spine_id=None, ontario_ghg_id=int(oi), ghgrp_id=str(fi),
                     name=o_row["Facility Name"], o_city=o_row["Facility City"],
                     f_city=f_row["Facility City or District or Municipality"],
                     tier=t, ratio=round(ra,4),
                     ontario_2024_adj_t=round(o_adj,1), ghgrp_2024_t=round(f_tot,1),
                     delta_t=round(delta,1),
                     delta_pct=round(delta/f_tot*100,1) if f_tot else None))
sid = {(r["ontario_ghg_id"], str(r["ghgrp_id"]) if r["ghgrp_id"] else None): r["spine_id"]
       for r in spine}
for r in rows:
    r["spine_id"] = sid.get((r["ontario_ghg_id"], r["ghgrp_id"]))
rows.sort(key=lambda r: -abs(r["delta_t"]))
dump(dict(n_matched_with_2024_both=len(rows),
          note="Ontario total adjusted to exclude biomass CO2 so it is comparable to the GHGRP total (excl. CO2bio). "
               "Both programs use a 10 kt reporting threshold, so matched facilities should be near-identical; "
               "deltas come from reporting boundaries, verification adjustments, and timing.",
          rows=rows,
          top_abs_deltas=rows[:15],
          top_pct_deltas=sorted([r for r in rows if r["ghgrp_2024_t"] and r["ghgrp_2024_t"]>10000],
                                key=lambda r: -abs(r["delta_pct"] or 0))[:15]),
     OUT/"joins"/"ghg_vs_ghgrp.json")

# join (b): EWRB
ew_sample = ew[ew["report_year"]==2024].head(0)  # no building-level rows publishable as joins
dump(dict(
    note="No record-level join exists: EWRB publishes no building names or street addresses, only city and "
         "3-character postal code, so no EWRB row can be resolved to a named facility. All EWRB rows are "
         "quarantined with reason codes. This file carries city-level manufacturing-plant intensity context "
         "attached to matched industrial facilities (ecological confidence, not building-level).",
    cities_with_manufacturing_context=len(city_ctx),
    facilities_with_context=attached,
    city_context=city_ctx,
    best_matches=[dict(spine_id=r["spine_id"], name=r["canonical_name"], city=r["city"],
                       tier=r["tier"], ewrb= {k:v for k,v in r["ewrb_context"].items() if k!="note"})
                  for r in sorted(spine, key=lambda r: -(r["ontario_2024_t"] or 0))
                  if r["ewrb_context"]][:25],
), OUT/"joins"/"ewrb_joined.json")

# join (c): landfill / methane
print("landfill join...")
def is_landfill(name, naics):
    n = str(name).upper()
    return ("LANDFILL" in n or "WASTE" in n and ("DISPOSAL" in n or "MANAGEMENT" in n)
            or str(naics).startswith("56221"))
lf = []
for oi, o in ont_fac.items():
    if is_landfill(o["latest_name"], o["naics"]):
        s24 = o["series"].get(2024)
        tot = s24[0] if s24 else None
        ch4 = s24[2] if s24 else None
        lf.append(dict(program="ontario_ghg", facility_id=str(oi), name=o["latest_name"],
                       city=o["city"], naics=o["naics"], total_2024_t=tot,
                       ch4_2024_co2e_t=ch4,
                       ch4_share_pct=round(ch4/tot*100,1) if tot else None))
for fi, f in fed_fac.items():
    if is_landfill(f["latest_name"], f["naics"]):
        s24 = f["series"].get(2024)
        tot = s24[0] if s24 else None
        ch4 = s24[1] if s24 else None
        lf.append(dict(program="federal_ghgrp", facility_id=str(fi), name=f["latest_name"],
                       city=f["city"], naics=f["naics"], total_2024_t=tot,
                       ch4_2024_co2e_t=ch4,
                       ch4_share_pct=round(ch4/tot*100,1) if tot else None))
lf_rank = sorted([x for x in lf if x["ch4_2024_co2e_t"]], key=lambda x: -x["ch4_2024_co2e_t"])
dump(dict(
    join_spec=dict(
        purpose="Link the Ontario landfill registry (waste disposal site inventory) to the emissions spine.",
        join_keys=["facility name (normalized)", "municipality/city", "postal code FSA", "operator/legal name"],
        expected_confidence="anchored on exact normalized (name, city); resolved on fuzzy name + same municipality",
        grain="One registry site may map to one spine facility; multi-cell landfills may split across ECA approvals.",
        blocker="The registry was not part of this build; only the facility-side methane ranking below is computed.",
    ),
    n_landfill_like=len(lf),
    methane_ranking_2024=lf_rank[:30],
), OUT/"joins"/"landfill_methane.json")

# anomalies
dump(sorted(anoms, key=lambda a: -abs(a["pct_change"]))[:200], OUT/"anomalies.json")

# examples.json is built by scripts/make_examples.py (curated cases)

print("done.")
print(json.dumps(stats, indent=1)[:2000])
