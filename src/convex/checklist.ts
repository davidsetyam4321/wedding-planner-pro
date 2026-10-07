import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { workspaceUserId } from "./workspace";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return [];
    const userId = await workspaceUserId(ctx);
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
  args: {
    label: v.string(),
    dueDate: v.optional(v.number()),
    priority: v.optional(
      v.union(v.literal("tinggi"), v.literal("sedang"), v.literal("rendah")),
    ),
  },
  handler: async (ctx, { label, dueDate, priority }) => {
    const userId = await workspaceUserId(ctx);

    // ID dikembalikan supaya alur "urungkan hapus" bisa memulihkan status
    // selesai yang ikut terhapus.
    return await ctx.db.insert("checklistItem", {
      userId,
      label: label.trim() || "Tugas baru",
      done: false,
      sortOrder: await nextSortOrder(ctx, userId),
      createdAt: Date.now(),
      dueDate: dueDate && dueDate > 0 ? dueDate : undefined,
      priority,
    });
  },
});

/** Adds many tasks at once — the UI turns pasted newlines into an array. */
export const createMany = mutation({
  args: { labels: v.array(v.string()), dueDate: v.optional(v.number()) },
  handler: async (ctx, { labels, dueDate }) => {
    const userId = await workspaceUserId(ctx);

    let order = await nextSortOrder(ctx, userId);
    const cleaned = labels.map((label) => label.trim()).filter(Boolean);
    for (const label of cleaned) {
      await ctx.db.insert("checklistItem", {
        userId,
        label,
        done: false,
        sortOrder: order++,
        createdAt: Date.now(),
        dueDate: dueDate && dueDate > 0 ? dueDate : undefined,
      });
    }
    return cleaned.length;
  },
});

export const update = mutation({
  args: {
    itemId: v.id("checklistItem"),
    label: v.string(),
    dueDate: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, { itemId, label, dueDate }) => {
    const userId = await workspaceUserId(ctx);

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    const cleaned = label.trim();
    if (!cleaned) throw new Error("Tugas tidak boleh kosong");
    const patch: { label: string; dueDate?: number | undefined } = { label: cleaned };
    if (dueDate !== undefined) {
      patch.dueDate =
        dueDate !== null && dueDate > 0 ? dueDate : undefined;
    }
    await ctx.db.patch(itemId, patch);
  },
});

export const toggle = mutation({
  args: { itemId: v.id("checklistItem"), done: v.boolean() },
  handler: async (ctx, { itemId, done }) => {
    const userId = await workspaceUserId(ctx);

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.patch(itemId, {
      done,
      doneAt: done ? Date.now() : undefined,
    });
  },
});

export const setPriority = mutation({
  args: {
    itemId: v.id("checklistItem"),
    priority: v.union(
      v.literal("tinggi"),
      v.literal("sedang"),
      v.literal("rendah"),
    ),
  },
  handler: async (ctx, { itemId, priority }) => {
    const userId = await workspaceUserId(ctx);

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.patch(itemId, { priority });
  },
});

export const remove = mutation({
  args: { itemId: v.id("checklistItem") },
  handler: async (ctx, { itemId }) => {
    const userId = await workspaceUserId(ctx);

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.delete(itemId);
  },
});

/** Bulk cleanup once the wedding prep is winding down. */
export const clearDone = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await workspaceUserId(ctx);

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
