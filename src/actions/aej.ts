"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateOfficialAej } from "@/modules/official-documents/services/aej-generation.service";
import { requireAejPermission } from "@/modules/official-documents/services/aej-permission.service";
import { signAejGeneration } from "@/modules/digital-signatures/services/aej-signature.service";

export async function generateAejAction(formData: FormData) {
  const session = await requireAejPermission("AEJ_GENERATE");
  const closingPeriodId = String(formData.get("closingPeriodId") ?? "");
  if (!closingPeriodId) redirect("/admin/rep-p/aej?error=invalid-period");
  let generation; try { generation = await generateOfficialAej(closingPeriodId, session.user.id); }
  catch { redirect("/admin/rep-p/aej?error=generation-failed"); }
  revalidatePath("/admin/rep-p/aej"); redirect(`/admin/rep-p/aej/${generation.id}`);
}

export async function signAejAction(id: string) {
  const session = await requireAejPermission("AEJ_GENERATE");
  try { await signAejGeneration(id, session.user.id); revalidatePath(`/admin/rep-p/aej/${id}`); revalidatePath("/admin/rep-p/aej"); }
  catch { redirect(`/admin/rep-p/aej/${id}?error=signature`); }
}
