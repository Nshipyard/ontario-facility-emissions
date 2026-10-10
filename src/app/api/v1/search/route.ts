import { NextResponse } from "next/server";
import { searchSpine } from "@/lib/spine";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const city = url.searchParams.get("city") ?? "";
  const tier = url.searchParams.get("tier") ?? "";
  const program = url.searchParams.get("program") ?? "";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
  const { total, hits } = searchSpine(q, city, tier, program, limit);
  return NextResponse.json({ q, city, tier, program, limit, total, hits });
}
