import { NextResponse } from "next/server";
import { getData, cityLatLon } from "@/lib/spine";

// Slim points for the hand-built Ontario match map. All 513 facilities carry
// an authored city coordinate in the lookup table.
export async function GET() {
  const { spine } = getData();
  const points = spine.map((f) => {
    const ll = cityLatLon(f.city);
    return {
      spine_id: f.spine_id,
      name: f.canonical_name,
      city: f.city,
      tier: f.tier,
      lat: ll?.[0] ?? null,
      lon: ll?.[1] ?? null,
      t: Math.max(f.ontario_2024_t ?? 0, f.ghgrp_2024_t ?? 0),
    };
  });
  return NextResponse.json({ count: points.length, points });
}
