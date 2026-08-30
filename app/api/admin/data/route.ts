import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase-server";

const TABLES = {
  prayers: "prayer_times", lessons: "torah_lessons", events: "events",
  settings: "synagogue_settings", synagogue: "synagogues", themes: "display_themes",
} as const;

async function context() {
  const token = (await cookies()).get("shulsign_access")?.value;
  if (!token) return null;
  const response = await supabaseFetch("/rest/v1/synagogue_members?select=synagogue_id,user_id,role&limit=1", token);
  if (!response.ok) return null;
  const memberships = await response.json() as { synagogue_id: string; user_id: string; role: string }[];
  return memberships[0] ? { token, ...memberships[0] } : null;
}

async function readTable(table: string, synagogueId: string, token: string) {
  const ownershipFilter = table === "synagogues"
    ? `id=eq.${synagogueId}`
    : `synagogue_id=eq.${synagogueId}`;
  const response = await supabaseFetch(`/rest/v1/${table}?select=*&${ownershipFilter}`, token);
  if (!response.ok) throw new Error(table);
  return response.json();
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const [synagogue, settings, prayers, lessons, events, themes] = await Promise.all([
      readTable("synagogues", ctx.synagogue_id, ctx.token),
      readTable("synagogue_settings", ctx.synagogue_id, ctx.token),
      readTable("prayer_times", ctx.synagogue_id, ctx.token),
      readTable("torah_lessons", ctx.synagogue_id, ctx.token),
      readTable("events", ctx.synagogue_id, ctx.token),
      readTable("display_themes", ctx.synagogue_id, ctx.token),
    ]);
    return NextResponse.json(
      { synagogue: synagogue[0], settings: settings[0], prayers, lessons, events, themes, role: ctx.role, user_id: ctx.user_id },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ error: "load_failed" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json() as { resource?: keyof typeof TABLES; action?: "create" | "update" | "delete"; id?: string; values?: Record<string, unknown> };
  if (!body.resource || !TABLES[body.resource] || !body.action) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const table = TABLES[body.resource];
  const base = `/rest/v1/${table}`;
  let path = base;
  let method = "POST";
  let payload: Record<string, unknown> | undefined;

  if (body.action === "create") {
    if (!["prayers", "lessons", "events", "themes"].includes(body.resource)) return NextResponse.json({ error: "invalid_create" }, { status: 400 });
    payload = { ...body.values, synagogue_id: ctx.synagogue_id };
  } else if (body.action === "update") {
    method = "PATCH";
    const filter = body.resource === "settings"
      ? `synagogue_id=eq.${ctx.synagogue_id}`
      : body.resource === "synagogue"
        ? `id=eq.${ctx.synagogue_id}`
        : `id=eq.${encodeURIComponent(body.id || "")}&synagogue_id=eq.${ctx.synagogue_id}`;
    path = `${base}?${filter}`;
    payload = body.values || {};
  } else {
    if (!["prayers", "lessons", "events", "themes"].includes(body.resource) || !body.id) return NextResponse.json({ error: "invalid_delete" }, { status: 400 });
    method = "DELETE";
    path = `${base}?id=eq.${encodeURIComponent(body.id)}&synagogue_id=eq.${ctx.synagogue_id}`;
  }

  const response = await supabaseFetch(path, ctx.token, {
    method, body: payload ? JSON.stringify(payload) : undefined,
    headers: { Prefer: "return=representation" },
  });
  if (!response.ok) return NextResponse.json({ error: "save_failed", detail: await response.text() }, { status: response.status });
  const rows = await response.json() as Record<string, unknown>[];
  if (!rows.length) {
    return NextResponse.json(
      { error: "no_rows_changed", detail: "No matching row was changed. Check the record id and database permissions." },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { ok: true, rows },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
