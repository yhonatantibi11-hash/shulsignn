import { redirect } from "next/navigation";

export default function LegacyDisplayEntry() {
  redirect("/app/index.html#/display?sid=mizmor-ledavid");
}
