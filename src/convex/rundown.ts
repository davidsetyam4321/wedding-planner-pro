import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { workspaceUserId } from "./workspace";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return [];
    const userId = await workspaceUserId(ctx);
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
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, { startTime, title, note, durationMinutes }) => {
    const userId = await workspaceUserId(ctx);
    if (!title.trim()) throw new Error("Nama acara wajib diisi");

    await ctx.db.insert("rundownItem", {
      userId,
      startTime: /^\d{2}:\d{2}$/.test(startTime) ? startTime : "08:00",
      title: title.trim(),
      note: note?.trim() || undefined,
      durationMinutes:
        durationMinutes === undefined
          ? undefined
          : Math.max(0, Math.round(durationMinutes)),
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    itemId: v.id("rundownItem"),
    startTime: v.optional(v.string()),
    title: v.optional(v.string()),
    note: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await workspaceUserId(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    const patch: {
      startTime?: string;
      title?: string;
      note?: string;
      durationMinutes?: number;
    } = {};

    if (args.startTime !== undefined && /^\d{2}:\d{2}$/.test(args.startTime)) {
      patch.startTime = args.startTime;
    }
    if (args.title !== undefined) {
      const cleaned = args.title.trim();
      if (!cleaned) throw new Error("Nama acara wajib diisi");
      patch.title = cleaned;
    }
    if (args.note !== undefined) patch.note = args.note.trim() || undefined;
    if (args.durationMinutes !== undefined) {
      patch.durationMinutes = Math.max(0, Math.round(args.durationMinutes));
    }

    await ctx.db.patch(args.itemId, patch);
  },
});

export const remove = mutation({
  args: { itemId: v.id("rundownItem") },
  handler: async (ctx, { itemId }) => {
    const userId = await workspaceUserId(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.delete(itemId);
  },
});
