import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("savingDeposit")
      .withIndex("by_user_savedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: { amount: v.number(), note: v.optional(v.string()) },
  handler: async (ctx, { amount, note }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const cleaned = Math.round(amount);
    if (cleaned <= 0) throw new Error("Nominal harus lebih dari nol");

    await ctx.db.insert("savingDeposit", {
      userId,
      amount: cleaned,
      note: note?.trim() ? note.trim() : undefined,
      savedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { depositId: v.id("savingDeposit") },
  handler: async (ctx, { depositId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const deposit = await ctx.db.get(depositId);
    if (!deposit || deposit.userId !== userId) {
      throw new Error("Deposit not found");
    }
    await ctx.db.delete(depositId);
  },
});
