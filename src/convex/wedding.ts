import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const DEFAULT_WEDDING_DATE = new Date("2027-08-26T09:00:00+07:00").getTime();

const DEFAULT_CHECKLIST = [
  "Tentukan tanggal & venue",
  "Hitung perkiraan jumlah tamu",
  "Susun draft anggaran",
  "Booking katering",
  "Fitting baju pengantin",
  "Pilih makeup artist",
  "Booking foto & video",
  "Cetak & kirim undangan",
  "Susun rundown akad & resepsi",
  "Konfirmasi semua vendor di H-7",
];

const DEFAULT_BUDGET_CATEGORIES = [
  { name: "Venue", allocated: 12_000_000 },
  { name: "Katering", allocated: 18_000_000 },
  { name: "Dekorasi", allocated: 8_000_000 },
  { name: "Baju & Aksesoris", allocated: 6_000_000 },
  { name: "Foto & Video", allocated: 5_000_000 },
  { name: "Rias & Makeup", allocated: 3_000_000 },
  { name: "Hiburan", allocated: 4_000_000 },
  { name: "Undangan & Merch", allocated: 2_000_000 },
  { name: "Dokumen & Lainnya", allocated: 6_000_000 },
];

export const get = query({
  args: {},
  handler: async (ctx): Promise<Doc<"wedding"> | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/** Creates the workspace with friendly defaults on first visit. Idempotent. */
export const ensureSetup = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const existing = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return existing._id;

    const weddingId = await ctx.db.insert("wedding", {
      userId,
      partnerOneName: "Kamu",
      partnerTwoName: "Pasangan",
      weddingDate: DEFAULT_WEDDING_DATE,
      fundTarget: 64_000_000,
      fundClaimed: false,
      setupComplete: false,
    });

    for (let i = 0; i < DEFAULT_CHECKLIST.length; i++) {
      await ctx.db.insert("checklistItem", {
        userId,
        label: DEFAULT_CHECKLIST[i],
        done: false,
        sortOrder: i,
      });
    }

    for (let i = 0; i < DEFAULT_BUDGET_CATEGORIES.length; i++) {
      await ctx.db.insert("budgetCategory", {
        userId,
        name: DEFAULT_BUDGET_CATEGORIES[i].name,
        allocated: DEFAULT_BUDGET_CATEGORIES[i].allocated,
        sortOrder: i,
      });
    }

    return weddingId;
  },
});

export const updateSettings = mutation({
  args: {
    partnerOneName: v.string(),
    partnerTwoName: v.string(),
    weddingDate: v.number(),
    fundTarget: v.number(),
    setupComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");

    await ctx.db.patch(wedding._id, {
      partnerOneName: args.partnerOneName.trim() || "Kamu",
      partnerTwoName: args.partnerTwoName.trim() || "Pasangan",
      weddingDate: args.weddingDate,
      fundTarget: Math.max(0, Math.round(args.fundTarget)),
      ...(args.setupComplete === undefined ? {} : { setupComplete: args.setupComplete }),
    });
  },
});

/** One-time demo bonus: adds Rp 79.000 to savings. */
export const claimFundBonus = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");
    if (wedding.fundClaimed) return { claimed: false };

    await ctx.db.insert("savingDeposit", {
      userId,
      amount: 79_000,
      note: "Bonus demo premium",
      savedAt: Date.now(),
    });
    await ctx.db.patch(wedding._id, { fundClaimed: true });

    return { claimed: true };
  },
});
