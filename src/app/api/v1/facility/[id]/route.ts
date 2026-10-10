import { NextResponse } from "next/server";
import { getFacility } from "@/lib/spine";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const f = getFacility(id);
  if (!f) {
    return NextResponse.json({ error: `No facility with spine_id ${id}` }, { status: 404 });
  }
  return NextResponse.json(f);
}
