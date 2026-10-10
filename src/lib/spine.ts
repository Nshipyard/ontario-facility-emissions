import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "public", "data");

// Authored municipal-centroid lookup (approximate, 2-decimal). Used only to
// plot facility cities on the hand-built Ontario SVG. Facilities whose city
// is absent from this table are not plotted; the map footer reports the count.
const CITY_LATLON: Record<string, [number, number]> = {
  "toronto": [43.65, -79.38],
  "north york": [43.77, -79.42],
  "scarborough": [43.77, -79.26],
  "etobicoke": [43.65, -79.52],
  "rexdale": [43.72, -79.58],
  "leamington": [42.05, -82.60],
  "kingsville": [42.04, -82.74],
  "ruthven": [42.02, -82.70],
  "mississauga": [43.59, -79.64],
  "hamilton": [43.26, -79.87],
  "aldershot": [43.31, -79.86],
  "dundas": [43.27, -79.96],
  "stoney creek": [43.22, -79.76],
  "ottawa": [45.42, -75.70],
  "brampton": [43.68, -79.76],
  "sarnia": [42.97, -82.40],
  "corunna": [42.88, -82.45],
  "courtright": [42.78, -82.47],
  "mooretown": [42.85, -82.45],
  "sombra": [42.72, -82.48],
  "london": [42.98, -81.25],
  "windsor": [42.32, -83.03],
  "walkerville": [42.33, -83.00],
  "maidstone township": [42.42, -82.90],
  "essex": [42.17, -82.82],
  "cottam": [42.13, -82.68],
  "staples": [42.13, -82.55],
  "guelph": [43.55, -80.25],
  "moorefield": [43.75, -80.75],
  "elmira": [43.60, -80.56],
  "sault ste. marie": [46.52, -84.35],
  "sault ste marie": [46.52, -84.35],
  "concord": [43.83, -79.50],
  "vaughan": [43.84, -79.52],
  "port colborne": [42.88, -79.25],
  "kingston": [44.23, -76.48],
  "bath": [44.18, -76.78],
  "greater napanee": [44.25, -76.95],
  "napanee": [44.25, -76.95],
  "thunder bay": [48.38, -89.25],
  "thunder bay unorganized": [48.45, -89.30],
  "nipigon": [48.01, -88.27],
  "terrace bay": [48.80, -87.10],
  "brantford": [43.14, -80.26],
  "ohsweken": [43.07, -80.13],
  "lowbanks": [42.85, -79.55],
  "markham": [43.87, -79.26],
  "pickering": [43.84, -79.09],
  "oakville": [43.45, -79.69],
  "cambridge": [43.36, -80.31],
  "breslau": [43.48, -80.40],
  "chatham": [42.40, -82.18],
  "kent bridge": [42.45, -82.05],
  "dresden": [42.58, -82.18],
  "niagara falls": [43.09, -79.08],
  "st. catharines": [43.16, -79.25],
  "niagara on the lake": [43.25, -79.07],
  "st. thomas": [42.78, -81.18],
  "st thomas": [42.78, -81.18],
  "aylmer": [42.77, -80.98],
  "south porcupine": [48.47, -81.20],
  "timmins": [48.47, -81.33],
  "timmins/district of cochrane": [48.47, -81.33],
  "milton": [43.52, -79.88],
  "copper cliff": [46.47, -80.97],
  "onaping": [46.62, -81.42],
  "falconbridge": [46.57, -80.78],
  "kitchener": [43.45, -80.49],
  "waterloo": [43.47, -80.52],
  "blenheim": [42.33, -81.98],
  "collingwood": [44.50, -80.22],
  "kapuskasing": [49.42, -82.43],
  "hearst": [49.69, -83.67],
  "north bay": [46.31, -79.46],
  "tiverton": [44.33, -81.55],
  "cardinal": [44.79, -75.38],
  "ingersoll": [43.04, -80.88],
  "blind river": [46.18, -82.95],
  "maitland": [44.63, -75.60],
  "brockville": [44.59, -75.68],
  "johnstown": [44.45, -75.75],
  "woodstock": [43.13, -80.75],
  "oshawa": [43.90, -78.86],
  "courtice": [43.88, -78.77],
  "whitby": [43.88, -78.94],
  "bowmanville": [43.91, -78.68],
  "nanticoke": [42.80, -80.07],
  "hagersville": [42.96, -80.16],
  "cochrane": [49.08, -81.02],
  "iroquois falls": [48.77, -80.68],
  "kirkland lake": [48.15, -80.03],
  "elk lake": [47.73, -80.32],
  "englehart": [47.83, -79.87],
  "matachewan": [47.98, -80.58],
  "thorold": [43.12, -79.20],
  "atikokan": [48.76, -91.62],
  "peterborough": [44.30, -78.32],
  "havelock": [44.43, -77.89],
  "kenora": [49.77, -94.49],
  "n/a concession, kenora district": [49.77, -94.49],
  "balmertown": [51.05, -93.72],
  "dryden": [49.78, -92.84],
  "fort frances": [48.61, -93.40],
  "emo": [48.63, -93.83],
  "haley": [46.03, -77.52],
  "pembroke": [45.82, -77.11],
  "stratford": [43.37, -80.98],
  "huntsville": [45.33, -79.22],
  "burlington": [43.33, -79.80],
  "belleville": [44.16, -77.39],
  "trenton": [44.10, -77.58],
  "madoc": [44.50, -77.47],
  "strathroy": [42.95, -81.62],
  "exeter": [43.35, -81.48],
  "cornwall": [45.03, -74.73],
  "ingleside": [45.02, -74.92],
  "winchester": [45.09, -75.36],
  "dubreuilville": [48.63, -87.43],
  "l'orignal": [45.62, -74.69],
  "hawkesbury": [45.61, -74.60],
  "tunis": [49.20, -81.35],
  "newmarket": [44.06, -79.46],
  "georgetown": [43.65, -79.92],
  "halton hills": [43.63, -79.95],
  "haldimand county": [42.93, -79.88],
  "dunnville": [42.90, -79.62],
  "picton": [44.01, -77.14],
  "acton": [43.63, -80.03],
  "port hope": [43.95, -78.29],
  "alliston": [44.16, -79.87],
  "welland": [42.99, -79.25],
  "espanol": [46.26, -81.77],
  "espanola": [46.26, -81.77],
  "goderich": [43.74, -81.71],
  "geraldton": [49.72, -86.95],
  "st. marys": [43.26, -81.13],
  "port perry": [44.10, -78.94],
  "lindsay": [44.35, -78.74],
  "cobourg": [43.96, -78.17],
  "cornwall island": [45.00, -74.70],

  "hamiton": [43.26, -79.87],
  "porcupine": [48.47, -81.20],
  "matheson": [48.54, -80.47],
  "stouffville": [43.97, -79.25],
  "watford": [43.02, -81.87],
  "maple": [43.86, -79.51],
  "nairn centre": [46.37, -81.77],
  "lakeshore": [42.28, -82.62],
  "moose creek": [45.26, -74.60],
  "wheatley": [42.09, -82.44],
  "walpole": [42.63, -80.25],
  "25 milton": [43.52, -79.88],
  "west lincoln": [43.07, -79.57],
  "fort erie": [42.90, -78.92],
  "grimsby": [43.20, -79.55],
  "astra": [43.77, -79.42],
  "borden": [44.27, -79.90],
  "petawawa": [45.90, -77.28],
  "wawa": [47.99, -84.77],
  "mitchell": [43.47, -81.20],
  "grande pointe": [42.28, -82.68],
  "sandy lake": [53.07, -93.33],
  "downsview": [43.74, -79.47],
  "hannon": [43.18, -79.80],
  "marathon": [48.75, -86.38],
  "perth": [44.90, -76.25],
  "delhi": [42.85, -80.50],
  "arnprior": [45.43, -76.35],
  "gogama": [47.67, -81.72],
  "renfrew": [45.47, -76.68],
  "st. clair township": [42.87, -82.38],
  "listowel": [43.73, -80.95],
  "teeswater": [43.99, -81.28],
  "calstock": [49.83, -86.22],
  "tillsonburg": [42.87, -80.73],
  "paris": [43.20, -80.38],
  "barrie": [44.39, -79.69],
  "merlin": [42.23, -82.22],
  "wallenstein": [43.57, -80.62],
  "hammon": [43.26, -79.87],

  "rodney": [42.57, -81.68],
  "ridgetown": [42.43, -81.88],
  "red rock": [48.95, -88.25],
  "moore township": [42.85, -82.45],
  "owen sound": [44.57, -80.95],
  "dundalk": [44.17, -80.42],
  "nan": [44.50, -80.50],
  "levack": [46.62, -81.40],
  "chalk river": [46.02, -77.43],
  "garson": [46.57, -80.83],
};

export function cityLatLon(city: string): [number, number] | null {
  const key = city.trim().toLowerCase();
  return CITY_LATLON[key] ?? null;
}

export interface EwrbContext {
  city: string;
  n_buildings: number;
  median_wn_site_eui_gj_m2: number;
  p10_wn_site_eui: number;
  p90_wn_site_eui: number;
  median_ghg_kgco2e_m2: number;
  confidence: string;
  note: string;
}

export interface SpineRow {
  spine_id: string;
  canonical_name: string;
  city: string;
  tier: "anchored" | "resolved" | "unmatched";
  programs: string[];
  ontario_ghg_id: number | null;
  ontario_ghg_names: string[];
  ghgrp_id: string | null;
  ghgrp_names: string[];
  ghgrp_city: string | null;
  ghgrp_postal: string | null;
  ghgrp_npri: string | null;
  ontario_2024_t: number | null;
  ghgrp_2024_t: number | null;
  ontario_series: Record<string, number>;
  ghgrp_series: Record<string, number>;
  ewrb_context: EwrbContext | null;
  match_ratio: number | null;
}

export interface JoinRow {
  spine_id: string;
  name: string;
  o_city: string;
  f_city: string;
  tier: string;
  ratio: number;
  ontario_2024_adj_t: number | null;
  ghgrp_2024_t: number | null;
  delta_t: number;
  delta_pct: number;
}

export interface MethaneRow {
  program: string;
  facility_id: string;
  name: string;
  city: string;
  naics: string;
  total_2024_t: number;
  ch4_2024_co2e_t: number;
  ch4_share_pct: number;
}

export interface Anomaly {
  program: string;
  facility_id: string;
  facility_name: string;
  year_from: number;
  year_to: number;
  prev_t: number;
  curr_t: number;
  pct_change: number;
}

export interface FacilityDetail extends SpineRow {
  anomalies: Anomaly[];
  methane: MethaneRow[];
  join: JoinRow | null;
  delta_2024_t: number | null;
  delta_2024_pct: number | null;
}

function read<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8")) as T;
}

export interface StatsJson {
  spine_rows: number;
  tiers: { anchored: number; resolved: number; unmatched: number; quarantined: number };
  programs: { ontario_ghg: number; federal_ghgrp: number; ewrb_context: number };
  coverage: { all_3_programs: number; two_programs: number; one_program: number };
  merges: { total: number; anchored: number; resolved: number };
  ewrb: {
    rows: number;
    buildings: number;
    years: number[];
    quarantined_rows: number;
    quarantine_reasons: { no_building_identifier: number; zero_intensity: number; absurd_ghg_intensity: number };
  };
  anomalies: number;
  merge_log: string;
}

interface Cache {
  spine: SpineRow[];
  byId: Map<string, SpineRow>;
  stats: StatsJson;
  funnel: { funnel: { tier: string; count: number }[]; note: string };
  topEmitters: { rank: number; spine_id: string; name: string; city: string; kt_co2e_2024: number; tier: string; ghgrp_2024_t: number }[];
  join: { n_matched_with_2024_both: number; note: string; rows: JoinRow[]; top_abs_deltas: JoinRow[]; top_pct_deltas: JoinRow[] };
  joinById: Map<string, JoinRow>;
  methane: { join_spec: unknown; n_landfill_like: number; methane_ranking_2024: MethaneRow[] };
  methaneByKey: Map<string, MethaneRow[]>;
  ewrb: { note: string; cities_with_manufacturing_context: number; facilities_with_context: number; city_context: Record<string, Omit<EwrbContext, "city">>; best_matches: { spine_id: string; name: string; city: string; tier: string; ewrb: Omit<EwrbContext, "city" | "note"> }[] };
  anomalies: Anomaly[];
  anomaliesByKey: Map<string, Anomaly[]>;
  examples: unknown[];
}

let cache: Cache | null = null;

export function getData(): Cache {
  if (cache) return cache;
  const spine = read<SpineRow[]>("spine.json");
  const byId = new Map(spine.map((f) => [f.spine_id, f]));
  const join = read<Cache["join"]>("joins/ghg_vs_ghgrp.json");
  const joinById = new Map(join.rows.map((r) => [r.spine_id, r]));
  const methane = read<Cache["methane"]>("joins/landfill_methane.json");
  const methaneByKey = new Map<string, MethaneRow[]>();
  for (const m of methane.methane_ranking_2024) {
    const k = `${m.program}:${m.facility_id}`;
    const arr = methaneByKey.get(k) ?? [];
    arr.push(m);
    methaneByKey.set(k, arr);
  }
  const anomalies = read<Anomaly[]>("anomalies.json");
  const anomaliesByKey = new Map<string, Anomaly[]>();
  for (const a of anomalies) {
    const k = `${a.program}:${a.facility_id}`;
    const arr = anomaliesByKey.get(k) ?? [];
    arr.push(a);
    anomaliesByKey.set(k, arr);
  }
  cache = {
    spine,
    byId,
    stats: read<StatsJson>("stats.json"),
    funnel: read<Cache["funnel"]>("match_funnel.json"),
    topEmitters: read<Cache["topEmitters"]>("top_emitters.json"),
    join,
    joinById,
    methane,
    methaneByKey,
    ewrb: read<Cache["ewrb"]>("joins/ewrb_joined.json"),
    anomalies,
    anomaliesByKey,
    examples: read<unknown[]>("examples.json"),
  };
  return cache;
}

export function getFacility(id: string): FacilityDetail | null {
  const { byId, anomaliesByKey, methaneByKey, joinById } = getData();
  const f = byId.get(id);
  if (!f) return null;
  const keys: string[] = [];
  if (f.ontario_ghg_id != null) keys.push(`ontario_ghg:${f.ontario_ghg_id}`);
  if (f.ghgrp_id) keys.push(`federal_ghgrp:${f.ghgrp_id}`);
  const anomalies = keys.flatMap((k) => anomaliesByKey.get(k) ?? []);
  const methane = keys.flatMap((k) => methaneByKey.get(k) ?? []);
  const join = joinById.get(id) ?? null;
  let delta_2024_t: number | null = null;
  let delta_2024_pct: number | null = null;
  if (f.ontario_2024_t != null && f.ghgrp_2024_t != null) {
    delta_2024_t = f.ontario_2024_t - f.ghgrp_2024_t;
    delta_2024_pct = f.ghgrp_2024_t !== 0 ? (delta_2024_t / f.ghgrp_2024_t) * 100 : null;
  }
  return { ...f, anomalies, methane, join, delta_2024_t, delta_2024_pct };
}

export interface SearchHit {
  spine_id: string;
  canonical_name: string;
  city: string;
  tier: string;
  programs: string[];
  ontario_2024_t: number | null;
  ghgrp_2024_t: number | null;
}

export function searchSpine(q: string, city: string, tier: string, program: string, limit: number) {
  const { spine } = getData();
  const needle = q.trim().toLowerCase();
  const cityNeedle = city.trim().toLowerCase();
  const scored: { f: SpineRow; score: number }[] = [];
  for (const f of spine) {
    if (tier && f.tier !== tier) continue;
    if (program === "both") {
      if (!(f.programs.includes("ontario_ghg") && f.programs.includes("federal_ghgrp"))) continue;
    } else if (program === "ontario_only") {
      if (!(f.programs.includes("ontario_ghg") && !f.programs.includes("federal_ghgrp"))) continue;
    } else if (program === "federal_only") {
      if (!(f.programs.includes("federal_ghgrp") && !f.programs.includes("ontario_ghg"))) continue;
    }
    if (cityNeedle && !f.city.toLowerCase().includes(cityNeedle)) continue;
    if (!needle) {
      scored.push({ f, score: Math.max(f.ontario_2024_t ?? 0, f.ghgrp_2024_t ?? 0) });
      continue;
    }
    const hay = [f.canonical_name, ...f.ontario_ghg_names, ...f.ghgrp_names, f.city].join(" ").toLowerCase();
    const idx = hay.indexOf(needle);
    if (idx === -1) continue;
    scored.push({ f, score: idx === 0 ? 1e18 + Math.max(f.ontario_2024_t ?? 0, f.ghgrp_2024_t ?? 0) : Math.max(f.ontario_2024_t ?? 0, f.ghgrp_2024_t ?? 0) });
  }
  scored.sort((a, b) => b.score - a.score);
  const hits: SearchHit[] = scored.slice(0, limit).map((s) => ({
    spine_id: s.f.spine_id,
    canonical_name: s.f.canonical_name,
    city: s.f.city,
    tier: s.f.tier,
    programs: s.f.programs,
    ontario_2024_t: s.f.ontario_2024_t,
    ghgrp_2024_t: s.f.ghgrp_2024_t,
  }));
  return { total: scored.length, hits };
}

// Ontario bounding box for the hand-built facility map (equirectangular)
export const MAP = { LON0: -96, LON1: -73.5, LAT0: 41.5, LAT1: 57, W: 620, H: 560 };

export function projectOntario(lon: number, lat: number): [number, number] | null {
  if (!isFinite(lon) || !isFinite(lat)) return null;
  if (lon < MAP.LON0 || lon > MAP.LON1 || lat < MAP.LAT0 || lat > MAP.LAT1) return null;
  const x = ((lon - MAP.LON0) / (MAP.LON1 - MAP.LON0)) * MAP.W;
  const y = MAP.H - ((lat - MAP.LAT0) / (MAP.LAT1 - MAP.LAT0)) * MAP.H;
  return [x, y];
}
