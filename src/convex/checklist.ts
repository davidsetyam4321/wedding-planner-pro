import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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

async function nextSortOrder(ctx: MutationCtx, userId: Id<"users">): Promise<number> {
  const existing = await ctx.db
    .query("checklistItem")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return existing.length;
}

export const create = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    await ctx.db.insert("checklistItem", {
      userId,
      label: label.trim() || "Tugas baru",
      done: false,
      sortOrder: await nextSortOrder(ctx, userId),
      createdAt: Date.now(),
    });
  },
});

/** Adds many tasks at once — the UI turns pasted newlines into an array. */
export const createMany = mutation({
  args: { labels: v.array(v.string()) },
  handler: async (ctx, { labels }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    let order = await nextSortOrder(ctx, userId);
    const cleaned = labels.map((label) => label.trim()).filter(Boolean);
    for (const label of cleaned) {
      await ctx.db.insert("checklistItem", {
        userId,
        label,
        done: false,
        sortOrder: order++,
        createdAt: Date.now(),
      });
    }
    return cleaned.length;
  },
});

export const update = mutation({
  args: { itemId: v.id("checklistItem"), label: v.string() },
  handler: async (ctx, { itemId, label }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    const cleaned = label.trim();
    if (!cleaned) throw new Error("Tugas tidak boleh kosong");
    await ctx.db.patch(itemId, { label: cleaned });
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

/** Bulk cleanup once the wedding prep is winding down. */
export const clearDone = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const items = await ctx.db
      .query("checklistItem")
      .withIndex("by_user_done", (q) => q.eq("userId", userId).eq("done", true))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return items.length;
  },
});
