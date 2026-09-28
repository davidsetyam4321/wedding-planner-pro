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
  },
  handler: async (ctx, { name, category, contact, cost }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    if (!name.trim()) throw new Error("Nama vendor wajib diisi");

    await ctx.db.insert("vendor", {
      userId,
      name: name.trim(),
      category: category.trim() || "Lainnya",
      contact: contact?.trim() || undefined,
      cost: Math.max(0, Math.round(cost)),
      status: "belum",
      createdAt: Date.now(),
    });
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
