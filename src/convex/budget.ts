import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { categories: [], expenses: [] as Doc<"budgetExpense">[] };
    }

    const categories = await ctx.db
      .query("budgetCategory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    categories.sort((a, b) => a.sortOrder - b.sortOrder);

    const expenses = await ctx.db
      .query("budgetExpense")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return { categories, expenses };
  },
});

async function requireCategory(ctx: MutationCtx, categoryId: Id<"budgetCategory">) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in");
  const category = await ctx.db.get(categoryId);
  if (!category || category.userId !== userId) {
    throw new Error("Category not found");
  }
  return category;
}

export const createCategory = mutation({
  args: { name: v.string(), allocated: v.number() },
  handler: async (ctx, { name, allocated }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const existing = await ctx.db
      .query("budgetCategory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await ctx.db.insert("budgetCategory", {
      userId,
      name: name.trim() || "Kategori baru",
      allocated: Math.max(0, Math.round(allocated)),
      sortOrder: existing.length,
    });
  },
});

export const setCategoryAllocation = mutation({
  args: { categoryId: v.id("budgetCategory"), allocated: v.number() },
  handler: async (ctx, { categoryId, allocated }) => {
    await requireCategory(ctx, categoryId);
    await ctx.db.patch(categoryId, {
      allocated: Math.max(0, Math.round(allocated)),
    });
  },
});

export const deleteCategory = mutation({
  args: { categoryId: v.id("budgetCategory") },
  handler: async (ctx, { categoryId }) => {
    await requireCategory(ctx, categoryId);

    const expenses = await ctx.db
      .query("budgetExpense")
      .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
      .collect();
    for (const expense of expenses) {
      await ctx.db.delete(expense._id);
    }
    await ctx.db.delete(categoryId);
  },
});

export const addExpense = mutation({
  args: {
    categoryId: v.id("budgetCategory"),
    label: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, { categoryId, label, amount }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const category = await ctx.db.get(categoryId);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found");
    }

    await ctx.db.insert("budgetExpense", {
      userId,
      categoryId,
      label: label.trim() || "Pengeluaran",
      amount: Math.max(0, Math.round(amount)),
    });
  },
});

export const toggleExpensePaid = mutation({
  args: { expenseId: v.id("budgetExpense"), paid: v.boolean() },
  handler: async (ctx, { expenseId, paid }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const expense = await ctx.db.get(expenseId);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found");
    }

    await ctx.db.patch(expenseId, { paidAt: paid ? Date.now() : undefined });
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("budgetExpense") },
  handler: async (ctx, { expenseId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const expense = await ctx.db.get(expenseId);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found");
    }
    await ctx.db.delete(expenseId);
  },
});
