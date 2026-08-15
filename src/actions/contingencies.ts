"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth/session";
import { db } from "@/db";
import { contingencyRequests } from "@/db/schema";
import { recordRepPEvent } from "@/rep-p/audit.service";
import { registerRepPPoint } from "@/services/rep-p-registration.service";
export async function reviewContingencyAction(id: string, formData: FormData) { const session = await requireAdmin(); const decision = String(formData.get("decision")); const reason = String(formData.get("reason") ?? "").trim(); if (!id || !["APPROVED", "DENIED"].includes(decision) || reason.length < 10) redirect("/admin/contingencias?error=review"); const [request] = await db.select().from(contingencyRequests).where(eq(contingencyRequests.id, id)).limit(1); if (!request || request.status !== "PENDING") redirect("/admin/contingencias?error=state"); let timeEntryId: string | undefined; let nsr: string | undefined; if (decision === "APPROVED") { const result = await registerRepPPoint({ employeeId: request.employeeId, collectorId: request.collectorId, eventType: request.eventType as "CLOCK_IN" | "CLOCK_OUT", idempotencyKey: `contingency-${request.id}`, trustedOccurredAt: request.requestedAt, contingency: true }); timeEntryId = result.id; nsr = result.nsr; } await db.update(contingencyRequests).set({ status: decision, reviewedBy: session.user.id, reviewedAt: new Date(), decisionReason: reason, timeEntryId }).where(eq(contingencyRequests.id, id)); await recordRepPEvent(db, { eventType: decision === "APPROVED" ? "CONTINGENCY_APPROVED" : "CONTINGENCY_DENIED", outcome: decision === "APPROVED" ? "SUCCESS" : "REJECTED", collectorId: request.collectorId, employeeId: request.employeeId, nsr, reasonCode: request.failureType, metadata: { requestId: request.id, reviewedBy: session.user.id } }); revalidatePath("/admin/contingencias"); }
