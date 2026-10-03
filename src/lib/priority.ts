/** Priority of a checklist task — mirrors `checklistItem.priority` in the schema. */
export type Priority = "tinggi" | "sedang" | "rendah";

export const PRIORITY_LABEL: Record<Priority, string> = {
  tinggi: "Tinggi",
  sedang: "Sedang",
  rendah: "Rendah",
};

/** Uppercase pill shown in the dashboard agenda list. */
export const PRIORITY_BADGE: Record<Priority, string> = {
  tinggi: "bg-tint-rose text-tint-rose-foreground",
  sedang: "bg-tint-butter text-tint-butter-foreground",
  rendah: "bg-tint-sage text-tint-sage-foreground",
};

/** Ordering weight for sorting (lower = more urgent). */
export const PRIORITY_RANK: Record<Priority, number> = {
  tinggi: 0,
  sedang: 1,
  rendah: 2,
};

/** Tasks created before priorities existed read as "sedang". */
export function normalizePriority(priority: Priority | undefined): Priority {
  return priority ?? "sedang";
}

/** Cycle order used by the inline priority chip. */
export function nextPriority(priority: Priority | undefined): Priority {
  const current = normalizePriority(priority);
  if (current === "tinggi") return "sedang";
  if (current === "sedang") return "rendah";
  return "tinggi";
}
