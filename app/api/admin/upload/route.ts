import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const token = (await cookies()).get("shulsign_access")?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const membership = await supabaseFetch("/rest/v1/synagogue_members?select=synagogue_id&limit=1", token);
  if (!membership.ok || !(await membership.json() as unknown[]).length) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  if (file.size > 2_000_000) return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return NextResponse.json({ file_url: `data:${file.type};base64,${btoa(binary)}` });
}
