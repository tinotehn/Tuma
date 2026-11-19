"use server";
import { redirect } from "next/navigation";
import { processAccountSubmission } from "@/lib/bot/account";
import { rateLimit } from "@/lib/security/rateLimit";

export async function submitAccount(formData: FormData) {
  const token = String(formData.get("t") ?? "");
  if (!(await rateLimit(`acct:${token.slice(-16)}`, 6, 600)).ok) redirect("/account/result?s=limit");
  const r = await processAccountSubmission({ token, bank: String(formData.get("bank") ?? ""), account: String(formData.get("account") ?? ""), confirm: String(formData.get("confirm") ?? "") });
  redirect(`/account/result?s=${r.ok ? "ok" : r.error}`);
}
