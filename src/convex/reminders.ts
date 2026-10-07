import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { workspaceUserId } from "./workspace";

export type Reminder = {
  kind: "task" | "vendor";
  id: string;
  label: string;
  dueDate: number;
  /** True bila tenggat sudah lewat. */
  overdue: boolean;
  /** Hari menuju tenggat (negatif = sudah lewat). */
  daysLeft: number;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Pengingat lintas fitur: tugas yang belum selesai dan vendor yang belum
 * lunas, keduanya harus punya tenggat. Diurutkan dari yang paling mendesak.
 * `now` dikirim dari klien supaya query tetap deterministik.
 */
export const list = query({
  args: { now: v.number() },
  handler: async (ctx, { now }): Promise<Reminder[]> => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return [];
    const userId = await workspaceUserId(ctx);

    const items = await ctx.db
      .query("checklistItem")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const vendors = await ctx.db
      .query("vendor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const reminders: Reminder[] = [];
    for (const item of items) {
      if (item.done || !item.dueDate) continue;
      reminders.push({
        kind: "task",
        id: item._id,
        label: item.label,
        dueDate: item.dueDate,
        overdue: item.dueDate < todayStart,
        daysLeft: Math.round((item.dueDate - todayStart) / DAY),
      });
    }
    for (const vendor of vendors) {
      if (vendor.status === "lunas" || !vendor.dueDate) continue;
      reminders.push({
        kind: "vendor",
        id: vendor._id,
        label:
          vendor.status === "dp"
            ? `Pelunasan ${vendor.name}`
            : `DP ${vendor.name}`,
        dueDate: vendor.dueDate,
        overdue: vendor.dueDate < todayStart,
        daysLeft: Math.round((vendor.dueDate - todayStart) / DAY),
      });
    }

    reminders.sort((a, b) => a.dueDate - b.dueDate);
    return reminders;
  },
});
