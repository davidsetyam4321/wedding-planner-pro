import { toast } from "sonner";

/** Inputs needed to calculate the budget summary independently of the UI. */
export type BudgetSummaryCategoryInput = {
  id: string;
  allocated: number;
};

export type BudgetSummaryExpenseInput = {
  source: "manual" | "vendor";
  categoryId?: string;
  amount: number;
  /** Whether this amount represents money already paid. */
  isPaid: boolean;
  /** Timestamp when the expense was recorded, used for the monthly trend. */
  trendAt?: number;
};

/** Amount already paid toward a vendor, capped at its total quoted cost. */
export function vendorPaidAmount(vendor: {
  cost: number;
  status: string;
  dpAmount?: number;
}): number {
  const cost = Math.max(0, vendor.cost);
  if (vendor.status === "lunas") return cost;
  if (vendor.status === "dp") {
    return Math.min(cost, Math.max(0, vendor.dpAmount ?? 0));
  }
  return 0;
}

export type BudgetCategoryTotals = {
  allocated: number;
  spent: number;
  paid: number;
};

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/**
 * Apply one consistent accounting rule throughout the budget screen:
 * manual rows count toward spending whether paid or not; paid totals only
 * include rows marked paid; vendor rows represent money already paid and
 * remain separate from category allocations.
 */
export function summarizeBudget(
  categories: BudgetSummaryCategoryInput[],
  expenses: BudgetSummaryExpenseInput[],
  savingsTotal: number,
) {
  const byCategory = new Map<string, BudgetCategoryTotals>();
  for (const category of categories) {
    byCategory.set(category.id, {
      allocated: category.allocated,
      spent: 0,
      paid: 0,
    });
  }

  let totalAllocated = 0;
  let totalSpent = 0;
  let totalPaid = 0;
  let vendorTotal = 0;
  const byMonth = new Map<string, number>();

  for (const category of categories) totalAllocated += category.allocated;

  for (const expense of expenses) {
    totalSpent += expense.amount;
    if (expense.isPaid) totalPaid += expense.amount;

    if (expense.source === "vendor") {
      vendorTotal += expense.amount;
    } else if (expense.categoryId) {
      const category = byCategory.get(expense.categoryId);
      if (category) {
        category.spent += expense.amount;
        if (expense.isPaid) category.paid += expense.amount;
      }
    }

    if (
      expense.trendAt !== undefined &&
      Number.isFinite(expense.trendAt) &&
      expense.trendAt > 0
    ) {
      const date = new Date(expense.trendAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + expense.amount);
    }
  }

  const monthKeys = [...byMonth.keys()].sort();
  const trendData: { month: string; baru: number; kumulatif: number }[] = [];
  if (monthKeys.length > 0) {
    const [startYear, startMonth] = monthKeys[0].split("-").map(Number);
    const [endYear, endMonth] = monthKeys[monthKeys.length - 1].split("-").map(Number);
    let year = startYear;
    let month = startMonth;
    let kumulatif = 0;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const baru = byMonth.get(key) ?? 0;
      kumulatif += baru;
      trendData.push({
        month: `${MONTHS_ID[month - 1]} '${String(year).slice(-2)}`,
        baru,
        kumulatif,
      });
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  }

  const spentPct =
    totalAllocated > 0
      ? Math.round((totalSpent / totalAllocated) * 100)
      : totalSpent > 0
        ? 100
        : 0;

  return {
    byCategory,
    totalAllocated,
    totalSpent,
    totalPaid,
    vendorTotal,
    remainingFunds: savingsTotal - totalSpent,
    spentPct,
    isOver: totalSpent > totalAllocated,
    trendData,
  };
}

/** Show an undo toast only after the deletion mutation succeeds. */
export async function deleteBudgetItem(
  message: string,
  remove: () => Promise<unknown>,
  restore: () => Promise<unknown> | unknown,
  options?: { successMessage?: string },
): Promise<void> {
  try {
    await remove();
    toast.success(message, {
      action: {
        label: "Urungkan",
        onClick: async () => {
          try {
            await restore();
            toast.success(options?.successMessage ?? "Data dikembalikan.");
          } catch {
            toast.error("Gagal mengembalikan. Muat ulang lalu coba lagi.");
          }
        },
      },
    });
  } catch {
    toast.error("Gagal menghapus data. Coba lagi.");
  }
}
