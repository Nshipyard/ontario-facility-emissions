import { NextResponse } from "next/server";
import { getData, getFacility, searchSpine } from "@/lib/spine";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "ontario-facility-emissions", version: "1.0.0" };

const TOOLS = [
  {
    name: "facility_lookup",
    description:
      "Full record for one canonical Ontario facility from the emissions identity spine: 2024 totals from the Ontario MECP program and the federal GHGRP, the program-vs-program delta, per-program name histories, annual emissions series, match tier, EWRB city-level building context, methane and year-over-year anomaly flags. Lookup by spine_id, e.g. ONF-000042.",
    inputSchema: {
      type: "object",
      properties: {
        spine_id: { type: "string", description: "Canonical spine ID, e.g. ONF-000042" },
      },
      required: ["spine_id"],
    },
  },
  {
    name: "spine_search",
    description:
      "Search the 513-facility Ontario emissions identity spine by facility name, city, program presence, and match tier, ranked by 2024 emissions.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Facility name or name-variant fragment" },
        city: { type: "string", description: "City fragment, e.g. Hamilton" },
        tier: { type: "string", enum: ["anchored", "unmatched"], description: "Identity match tier" },
        program: {
          type: "string",
          enum: ["both", "ontario_only", "federal_only"],
          description: "Program presence filter",
        },
        limit: { type: "integer", description: "Max results, default 50, max 200" },
      },
    },
  },
  {
    name: "match_stats",
    description:
      "Identity-resolution statistics: 458 anchored vs 0 resolved vs 55 unmatched facilities, the 30,693-row EWRB quarantine, the 416-pair 2024 program-vs-program agreement with top deltas, the top-30 emitter ranking, and the landfill methane ranking.",
    inputSchema: { type: "object", properties: {} },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handle(msg: unknown) {
  const m = msg as { jsonrpc?: string; method?: string; id?: unknown; params?: { name?: string; arguments?: Record<string, unknown> } } | null;
  if (!m || m.jsonrpc !== "2.0" || typeof m.method !== "string") {
    return err((m as { id?: unknown } | null)?.id ?? null, -32600, "Invalid Request");
  }
  const id = m.id ?? null;
  switch (m.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = m.params ?? {};
      try {
        if (name === "facility_lookup") {
          const sid = String(args?.spine_id ?? "").trim();
          const hit = sid ? getFacility(sid) : null;
          if (!hit) return err(id, -32001, "No facility with that spine_id");
          return ok(id, textResult(hit));
        }
        if (name === "spine_search") {
          const q = String(args?.q ?? "");
          const city = String(args?.city ?? "");
          const tier = String(args?.tier ?? "");
          const program = String(args?.program ?? "");
          const limit = Math.min(Math.max(parseInt(String(args?.limit ?? "50"), 10) || 50, 1), 200);
          return ok(id, textResult({ q, city, tier, program, limit, ...searchSpine(q, city, tier, program, limit) }));
        }
        if (name === "match_stats") {
          const { stats, funnel, topEmitters, join, methane, ewrb } = getData();
          return ok(id, textResult({
            stats,
            match_funnel: funnel,
            top_emitters: topEmitters,
            agreement_2024: {
              n_matched_with_2024_both: join.n_matched_with_2024_both,
              top_abs_deltas: join.top_abs_deltas.slice(0, 10),
              top_pct_deltas: join.top_pct_deltas.slice(0, 10),
            },
            landfill_methane: { n_landfill_like: methane.n_landfill_like, top_10: methane.methane_ranking_2024.slice(0, 10) },
            ewrb: {
              quarantined_rows: stats.ewrb.quarantined_rows,
              buildings: stats.ewrb.buildings,
              cities_with_manufacturing_context: ewrb.cities_with_manufacturing_context,
              facilities_with_context: ewrb.facilities_with_context,
            },
          }));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${m.method}`);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
