const url = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = () => process.env.SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(url() && key());
}

export async function supabaseFetch(path: string, token?: string, init: RequestInit = {}) {
  const baseUrl = url();
  const publishableKey = key();
  if (!baseUrl || !publishableKey) throw new Error("Supabase is not configured");
  const headers = new Headers(init.headers);
  headers.set("apikey", publishableKey);
  headers.set("Authorization", `Bearer ${token || publishableKey}`);
  if (init.body) headers.set("Content-Type", "application/json");
  return fetch(`${baseUrl}${path}`, { ...init, headers, cache: "no-store" });
}
