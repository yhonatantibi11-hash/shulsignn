import { NextResponse } from "next/server";
import { getPublicDisplay } from "@/lib/shulsign-data";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") || "mizmor-ledavid";
  const result = await getPublicDisplay(slug);
  if (result.status !== "ready") return NextResponse.json({ error: result.status }, { status: result.status === "not-found" ? 404 : 502 });
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "public, no-store, max-age=0" },
  });
}
