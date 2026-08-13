import type { EntryLike } from "./daily-attendance-core";

export type AdjustmentLike = { id: string; type: "ADD_ENTRY" | "IGNORE_ENTRY" | "FORGOTTEN_EXIT" | "JUSTIFY_LATE" | "JUSTIFY_EARLY_EXIT"; adjustedAt: Date | null; originalTimeEntryId: string | null; reason: string };

export function applyTimeAdjustments(entries: EntryLike[], adjustments: AdjustmentLike[]) {
  const ignored = new Set(adjustments.filter((item) => item.type === "IGNORE_ENTRY" && item.originalTimeEntryId).map((item) => item.originalTimeEntryId!));
  const originals = entries.filter((entry) => !ignored.has(entry.id)).map((entry) => ({ ...entry, origin: "ORIGINAL" as const, adjustmentId: null, reason: null }));
  const added = adjustments.filter((item) => (item.type === "ADD_ENTRY" || item.type === "FORGOTTEN_EXIT") && item.adjustedAt).map((item) => ({ id: `adjustment:${item.id}`, occurredAt: item.adjustedAt!, origin: "ADJUSTMENT" as const, adjustmentId: item.id, reason: item.reason }));
  return [...originals, ...added].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
}

export function hasLateJustification(adjustments: AdjustmentLike[]) { return adjustments.some((item) => item.type === "JUSTIFY_LATE"); }
