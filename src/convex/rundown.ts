import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const items = await ctx.db
      .query("rundownItem")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    items.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return items;
  },
});

export const create = mutation({
  args: {
    startTime: v.string(),
    title: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { startTime, title, note }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    if (!title.trim()) throw new Error("Nama acara wajib diisi");

    await ctx.db.insert("rundownItem", {
      userId,
      startTime: /^\d{2}:\d{2}$/.test(startTime) ? startTime : "08:00",
      title: title.trim(),
      note: note?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { itemId: v.id("rundownItem") },
  handler: async (ctx, { itemId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.delete(itemId);
  },
});
