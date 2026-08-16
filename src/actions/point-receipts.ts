"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { getPointReceiptForAccess, generatePointReceipt } from "@/modules/point-receipts/services/point-receipt.service";

export async function reprocessPointReceiptAction(id: string) {
  await requireAdmin();
  const receipt = await getPointReceiptForAccess(id);
  if (!receipt || receipt.status === "AVAILABLE") redirect("/admin/comprovantes?error=invalid-state");
  await generatePointReceipt(receipt.timeEntryId);
  revalidatePath("/admin/comprovantes");
}
