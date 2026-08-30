import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminClient from "./admin-client";
import { supabaseFetch } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const accessToken = store.get("shulsign_access")?.value;
  if (accessToken) {
    const response = await supabaseFetch("/auth/v1/user", accessToken);
    if (response.ok) redirect("/app/index.html#/admin");
  }
  if (store.get("shulsign_refresh")?.value) redirect("/api/auth/refresh");
  return <AdminClient authenticated={false} />;
}
