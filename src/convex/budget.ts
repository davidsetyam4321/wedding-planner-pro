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
    expenses.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

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

export const renameCategory = mutation({
  args: { categoryId: v.id("budgetCategory"), name: v.string() },
  handler: async (ctx, { categoryId, name }) => {
    await requireCategory(ctx, categoryId);
    const cleaned = name.trim();
    if (!cleaned) throw new Error("Nama kategori tidak boleh kosong");
    await ctx.db.patch(categoryId, { name: cleaned });
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

/**
 * Records an expense. Pass `categoryId` to use an existing category, or
 * `categoryName` to create the category on the fly — that keeps the single
 * "catat pengeluaran" form working even for a brand new kategori.
 */
export const addExpense = mutation({
  args: {
    categoryId: v.optional(v.id("budgetCategory")),
    categoryName: v.optional(v.string()),
    label: v.string(),
    amount: v.number(),
    paid: v.optional(v.boolean()),
  },
  handler: async (ctx, { categoryId, categoryName, label, amount, paid }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    let targetId = categoryId;
    if (targetId) {
      const category = await ctx.db.get(targetId);
      if (!category || category.userId !== userId) {
        throw new Error("Category not found");
      }
    } else {
      const cleaned = (categoryName ?? "Lainnya").trim() || "Lainnya";
      const existing = await ctx.db
        .query("budgetCategory")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const match = existing.find(
        (category) => category.name.toLowerCase() === cleaned.toLowerCase(),
      );
      if (match) {
        targetId = match._id;
      } else {
        targetId = await ctx.db.insert("budgetCategory", {
          userId,
          name: cleaned,
          allocated: 0,
          sortOrder: existing.length,
        });
      }
    }

    await ctx.db.insert("budgetExpense", {
      userId,
      categoryId: targetId,
      label: label.trim() || "Pengeluaran",
      amount: Math.max(0, Math.round(amount)),
      paidAt: paid ? Date.now() : undefined,
      createdAt: Date.now(),
    });
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("budgetExpense"),
    label: v.optional(v.string()),
    amount: v.optional(v.number()),
    categoryId: v.optional(v.id("budgetCategory")),
    paid: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.userId !== userId) throw new Error("Expense not found");

    const patch: {
      label?: string;
      amount?: number;
      categoryId?: Id<"budgetCategory">;
      paidAt?: number;
    } = {};

    if (args.label !== undefined) {
      const cleaned = args.label.trim();
      if (!cleaned) throw new Error("Keterangan tidak boleh kosong");
      patch.label = cleaned;
    }
    if (args.amount !== undefined) {
      patch.amount = Math.max(0, Math.round(args.amount));
    }
    if (args.categoryId !== undefined) {
      await requireCategory(ctx, args.categoryId);
      patch.categoryId = args.categoryId;
    }
    if (args.paid !== undefined) {
      patch.paidAt = args.paid ? Date.now() : 0;
    }

    await ctx.db.patch(args.expenseId, patch);
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
