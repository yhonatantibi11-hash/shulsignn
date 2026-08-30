import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const { email, password } = await request.json() as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "יש למלא מייל וסיסמה" }, { status: 400 });
  const response = await supabaseFetch("/auth/v1/token?grant_type=password", undefined, {
    method: "POST", body: JSON.stringify({ email, password }),
  });
  if (!response.ok) return NextResponse.json({ error: "המייל או הסיסמה אינם נכונים" }, { status: 401 });
  const session = await response.json() as { access_token: string; expires_in: number };
  const result = NextResponse.json({ ok: true });
  result.cookies.set("shulsign_access", session.access_token, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: session.expires_in,
  });
  return result;
}
