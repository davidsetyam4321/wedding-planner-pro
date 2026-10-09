import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { workspaceUserId } from "./workspace";

/** Pengeluaran manual yang sudah diberi penanda sumbernya. */
type ManualExpense = Doc<"budgetExpense"> & { source: "manual" };

/**
 * Baris pengeluaran turunan dari pembayaran vendor — tidak pernah disimpan,
 * dihitung ulang tiap kali overview dibuka supaya status DP/lunas di halaman
 * Vendor langsung tercermin di Budget tanpa pencatatan ganda.
 */
type VendorExpense = {
  source: "vendor";
  vendorId: Id<"vendor">;
  label: string;
  amount: number;
  /** Selalu terisi (uang sudah keluar); dipakai untuk total "Lunas". */
  paidAt: number;
};

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) {
      return {
        categories: [] as Doc<"budgetCategory">[],
        expenses: [] as (ManualExpense | VendorExpense)[],
        savingsTotal: 0,
        fundTarget: 0,
      };
    }
    const userId = await workspaceUserId(ctx);

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
    const manual: ManualExpense[] = expenses.map((expense) => ({
      ...expense,
      source: "manual" as const,
    }));

    // ── Sinkronisasi Vendor → Budget ─────────────────────────────────────
    // Uang yang benar-benar sudah keluar di halaman Vendor:
    //   status "dp"    → dpAmount yang sudah dibayar
    //   status "lunas" → seluruh biaya (cost)
    //   status "belum" → 0 (belum ada uang keluar, tidak dihitung)
    // Vendor tidak lagi dicocokkan ke kategori budget — cukup masuk sebagai
    // baris pengeluaran dengan label nama vendor.
    const vendors = await ctx.db
      .query("vendor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const vendorRows: VendorExpense[] = [];
    for (const vendor of vendors) {
      const amount =
        vendor.status === "lunas"
          ? vendor.cost
          : vendor.status === "dp"
            ? (vendor.dpAmount ?? 0)
            : 0;
      if (amount <= 0) continue;
      vendorRows.push({
        source: "vendor",
        vendorId: vendor._id,
        label: vendor.name,
        amount,
        // Deterministik (query tidak boleh bergantung Date.now()).
        paidAt: vendor.createdAt,
      });
    }

    // ── Sinkronisasi Tabungan → Budget ───────────────────────────────────
    const deposits = await ctx.db
      .query("savingDeposit")
      .withIndex("by_user_savedAt", (q) => q.eq("userId", userId))
      .collect();
    const savingsTotal = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);

    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const fundTarget = wedding?.fundTarget ?? 0;

    return {
      categories,
      expenses: [...manual, ...vendorRows],
      savingsTotal,
      fundTarget,
    };
  },
});

async function requireCategory(ctx: MutationCtx, categoryId: Id<"budgetCategory">) {
  // workspaceUserId (bukan getAuthUserId) supaya pasangan yang tergabung
  // tetap bisa mengubah kategori milik workspace bersama.
  const userId = await workspaceUserId(ctx);
  const category = await ctx.db.get(categoryId);
  if (!category || category.userId !== userId) {
    throw new Error("Category not found");
  }
  return category;
}

export const createCategory = mutation({
  args: { name: v.string(), allocated: v.number() },
  handler: async (ctx, { name, allocated }) => {
    const userId = await workspaceUserId(ctx);

    const cleaned = name.trim();
    if (!cleaned) throw new Error("Nama kategori tidak boleh kosong");
    if (!Number.isFinite(allocated)) throw new Error("Alokasi tidak valid");

    const existing = await ctx.db
      .query("budgetCategory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Nama unik (tanpa membedakan huruf besar/kecil) supaya donut & filter
    // berbasis nama di halaman tidak pernah tertukar.
    if (
      existing.some(
        (category) => category.name.toLowerCase() === cleaned.toLowerCase(),
      )
    ) {
      throw new Error("Nama kategori sudah dipakai");
    }

    // ID dikembalikan supaya alur "urungkan hapus" bisa mengembalikan
    // pengeluaran ke kategori yang baru dipulihkan.
    return await ctx.db.insert("budgetCategory", {
      userId,
      name: cleaned,
      allocated: Math.max(0, Math.round(allocated)),
      sortOrder: existing.length,
    });
  },
});

export const renameCategory = mutation({
  args: { categoryId: v.id("budgetCategory"), name: v.string() },
  handler: async (ctx, { categoryId, name }) => {
    const userId = await workspaceUserId(ctx);
    const category = await ctx.db.get(categoryId);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found");
    }

    const cleaned = name.trim();
    if (!cleaned) throw new Error("Nama kategori tidak boleh kosong");

    const siblings = await ctx.db
      .query("budgetCategory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (
      siblings.some(
        (item) =>
          item._id !== categoryId &&
          item.name.toLowerCase() === cleaned.toLowerCase(),
      )
    ) {
      throw new Error("Nama kategori sudah dipakai");
    }

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
    const userId = await workspaceUserId(ctx);

    const cleanedLabel = label.trim();
    if (!cleanedLabel) throw new Error("Keterangan tidak boleh kosong");
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Nominal harus lebih dari 0");
    }

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
      label: cleanedLabel,
      amount: Math.round(amount),
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
    const userId = await workspaceUserId(ctx);

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
      if (!Number.isFinite(args.amount) || args.amount <= 0) {
        throw new Error("Nominal harus lebih dari 0");
      }
      patch.amount = Math.round(args.amount);
    }
    if (args.categoryId !== undefined) {
      await requireCategory(ctx, args.categoryId);
      patch.categoryId = args.categoryId;
    }
    if (args.paid !== undefined) {
      // `undefined` menghapus field — konsisten dengan toggleExpensePaid,
      // supaya "belum lunas" tidak menyimpan angka 0 yang membingungkan.
      patch.paidAt = args.paid ? Date.now() : undefined;
    }

    await ctx.db.patch(args.expenseId, patch);
  },
});

export const toggleExpensePaid = mutation({
  args: { expenseId: v.id("budgetExpense"), paid: v.boolean() },
  handler: async (ctx, { expenseId, paid }) => {
    const userId = await workspaceUserId(ctx);

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
    const userId = await workspaceUserId(ctx);

    const expense = await ctx.db.get(expenseId);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found");
    }
    await ctx.db.delete(expenseId);
  },
});
