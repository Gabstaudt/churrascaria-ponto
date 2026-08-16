"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { afdGenerations, repRegistrars } from "@/db/schema";
import { generateOfficialAfd, previewAfd } from "@/modules/afd/services/afd-generation.service";
import { requireAfdPermission } from "@/modules/afd/services/afd-permission.service";

function input(formData: FormData) { const registrarId = String(formData.get("registrarId") ?? ""); const startDate = String(formData.get("startDate") ?? ""); const endDate = String(formData.get("endDate") ?? ""); if (!registrarId || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) redirect("/admin/rep-p/afd?error=invalid-period"); return { registrarId, startDate, endDate }; }

export async function validateAfdAction(formData: FormData) {
  await requireAfdPermission("AFD_VALIDATE"); const values = input(formData);
  let artifact; try { ({ artifact } = await previewAfd(values.registrarId, values.startDate, values.endDate)); }
  catch { redirect("/admin/rep-p/afd?error=validation-failed"); }
  const errors = artifact.issues.filter((item) => item.severity === "ERROR"); const warnings = artifact.issues.filter((item) => item.severity === "WARNING"); redirect(`/admin/rep-p/afd?validated=1&records=${artifact.recordCount}&errors=${errors.length}&warnings=${warnings.length}&codes=${encodeURIComponent(artifact.issues.map((item) => item.code).join(","))}`);
}

export async function generateAfdAction(formData: FormData) {
  const session = await requireAfdPermission("AFD_GENERATE"); const values = input(formData);
  let result; try { result = await generateOfficialAfd(values.registrarId, values.startDate, values.endDate, session.user.id); }
  catch { redirect("/admin/rep-p/afd?error=generation-failed"); }
  revalidatePath("/admin/rep-p/afd"); redirect(`/admin/rep-p/afd/${result.generationId}`);
}

export async function retryAfdGenerationAction(id: string) {
  const session = await requireAfdPermission("AFD_GENERATE"); const [previous] = await db.select().from(afdGenerations).where(eq(afdGenerations.id, id)).limit(1); if (!previous || previous.status !== "FAILED") redirect("/admin/rep-p/afd?error=invalid-retry"); const result = await generateOfficialAfd(previous.registrarId, previous.startDate, previous.endDate, session.user.id); redirect(`/admin/rep-p/afd/${result.generationId}`);
}

export async function configureRegistrarInpiAction(formData: FormData) {
  await requireAfdPermission("AFD_GENERATE"); const registrarId = String(formData.get("registrarId") ?? ""); const registration = String(formData.get("inpiRegistration") ?? "").replace(/\D/g, ""); if (!registrarId || !/^\d{1,17}$/.test(registration)) redirect("/admin/rep-p/afd?error=invalid-inpi"); await db.update(repRegistrars).set({ inpiRegistration: registration, updatedAt: new Date() }).where(eq(repRegistrars.id, registrarId)); revalidatePath("/admin/rep-p/afd"); redirect("/admin/rep-p/afd?saved=inpi");
}
