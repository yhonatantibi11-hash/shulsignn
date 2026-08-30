import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const store = await cookies();
  const refreshToken = store.get("shulsign_refresh")?.value;
  if (!refreshToken) return NextResponse.redirect(new URL("/admin", request.url));

  const response = await supabaseFetch("/auth/v1/token?grant_type=refresh_token", undefined, {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const result = NextResponse.redirect(new URL("/admin?session=expired", request.url));
    result.cookies.set("shulsign_access", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    result.cookies.set("shulsign_refresh", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
    return result;
  }

  const session = await response.json() as { access_token: string; refresh_token: string; expires_in: number };
  const result = NextResponse.redirect(new URL("/app/index.html#/admin", request.url));
  result.cookies.set("shulsign_access", session.access_token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: session.expires_in,
  });
  result.cookies.set("shulsign_refresh", session.refresh_token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return result;
}
