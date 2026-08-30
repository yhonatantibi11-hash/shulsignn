import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminClient from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = Boolean((await cookies()).get("shulsign_access")?.value);
  if (authenticated) redirect("/app/index.html#/admin");
  return <AdminClient authenticated={authenticated} />;
}
