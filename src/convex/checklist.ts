import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const items = await ctx.db
      .query("checklistItem")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return items;
  },
});

export const create = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const existing = await ctx.db
      .query("checklistItem")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await ctx.db.insert("checklistItem", {
      userId,
      label: label.trim() || "Tugas baru",
      done: false,
      sortOrder: existing.length,
    });
  },
});

export const toggle = mutation({
  args: { itemId: v.id("checklistItem"), done: v.boolean() },
  handler: async (ctx, { itemId, done }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.patch(itemId, { done });
  },
});

export const remove = mutation({
  args: { itemId: v.id("checklistItem") },
  handler: async (ctx, { itemId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.delete(itemId);
  },
});
