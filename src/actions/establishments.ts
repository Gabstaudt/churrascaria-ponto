"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/auth/session";
import { createEstablishmentWithRegistrar, EstablishmentConflictError } from "@/services/terminal-admin.service";
import { establishmentCreateSchema } from "@/validations/rep-p";

export async function createEstablishmentAction(formData: FormData) {
  const session = await requireAdmin();
  const parsed = establishmentCreateSchema.safeParse({
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
    registrarName: formData.get("registrarName"),
    registrarIdentifier: formData.get("registrarIdentifier"),
  });
  if (!parsed.success) redirect("/admin/estabelecimento?error=invalid");
  try {
    await createEstablishmentWithRegistrar(parsed.data, session.user.id);
  } catch (error) {
    redirect(`/admin/estabelecimento?error=${error instanceof EstablishmentConflictError ? "conflict" : "create"}`);
  }
  revalidatePath("/admin/geofence");
  redirect("/admin/estabelecimento?saved=1");
}
