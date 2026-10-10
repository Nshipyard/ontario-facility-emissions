import { NextResponse } from "next/server";
import { getData } from "@/lib/spine";

// Full spine: 513 canonical facility rows with per-program name variants,
// 2024 totals, annual series, and EWRB context where attached.
export async function GET() {
  const { spine } = getData();
  return NextResponse.json({ count: spine.length, facilities: spine });
}
