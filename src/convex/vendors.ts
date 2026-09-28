import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { vendorStatusValidator } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const vendors = await ctx.db
      .query("vendor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    vendors.sort((a, b) => a.createdAt - b.createdAt);
    return vendors;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    contact: v.optional(v.string()),
    cost: v.number(),
    dpAmount: v.optional(v.number()),
    note: v.optional(v.string()),
    status: v.optional(vendorStatusValidator),
  },
  handler: async (ctx, { name, category, contact, cost, dpAmount, note, status }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    if (!name.trim()) throw new Error("Nama vendor wajib diisi");

    await ctx.db.insert("vendor", {
      userId,
      name: name.trim(),
      category: category.trim() || "Lainnya",
      contact: contact?.trim() || undefined,
      cost: Math.max(0, Math.round(cost)),
      dpAmount: dpAmount === undefined ? undefined : Math.max(0, Math.round(dpAmount)),
      note: note?.trim() || undefined,
      status: status ?? "belum",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    vendorId: v.id("vendor"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    contact: v.optional(v.string()),
    cost: v.optional(v.number()),
    dpAmount: v.optional(v.number()),
    note: v.optional(v.string()),
    status: v.optional(vendorStatusValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const vendor = await ctx.db.get(args.vendorId);
    if (!vendor || vendor.userId !== userId) throw new Error("Vendor not found");

    const patch: {
      name?: string;
      category?: string;
      contact?: string;
      cost?: number;
      dpAmount?: number;
      note?: string;
      status?: "belum" | "dp" | "lunas";
    } = {};

    if (args.name !== undefined) {
      const cleaned = args.name.trim();
      if (!cleaned) throw new Error("Nama vendor wajib diisi");
      patch.name = cleaned;
    }
    if (args.category !== undefined) patch.category = args.category.trim() || "Lainnya";
    if (args.contact !== undefined) patch.contact = args.contact.trim() || undefined;
    if (args.cost !== undefined) patch.cost = Math.max(0, Math.round(args.cost));
    if (args.dpAmount !== undefined) {
      patch.dpAmount = Math.max(0, Math.round(args.dpAmount));
    }
    if (args.note !== undefined) patch.note = args.note.trim() || undefined;
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(args.vendorId, patch);
  },
});

export const setStatus = mutation({
  args: { vendorId: v.id("vendor"), status: vendorStatusValidator },
  handler: async (ctx, { vendorId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const vendor = await ctx.db.get(vendorId);
    if (!vendor || vendor.userId !== userId) throw new Error("Vendor not found");
    await ctx.db.patch(vendorId, { status });
  },
});

export const remove = mutation({
  args: { vendorId: v.id("vendor") },
  handler: async (ctx, { vendorId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const vendor = await ctx.db.get(vendorId);
    if (!vendor || vendor.userId !== userId) throw new Error("Vendor not found");
    await ctx.db.delete(vendorId);
  },
});
