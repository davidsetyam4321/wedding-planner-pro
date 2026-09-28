import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

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

const DEFAULT_MOODBOARD_CATEGORIES = ["Dekorasi", "Baju", "Makeup"];

/**
 * Mood board categories are free text, so besides the three defaults we adopt
 * any category name that older boxes already use.
 */
async function ensureMoodboardCategories(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await ctx.db
    .query("moodboardCategory")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const known = new Set(existing.map((category) => category.name));

  const boxes = await ctx.db
    .query("moodboardBox")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  let order = existing.length;
  for (const name of [...DEFAULT_MOODBOARD_CATEGORIES, ...boxes.map((b) => b.tab)]) {
    if (known.has(name)) continue;
    known.add(name);
    await ctx.db.insert("moodboardCategory", { userId, name, sortOrder: order++ });
  }
}

const DEFAULT_RUNDOWN = [
  { startTime: "07:00", title: "Persiapan & rias pengantin" },
  { startTime: "09:00", title: "Prosesi akad nikah" },
  { startTime: "11:00", title: "Sesi foto keluarga" },
  { startTime: "12:00", title: "Makan siang bersama" },
  { startTime: "18:00", title: "Resepsi & ramah tamah" },
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
    if (existing) {
      await ensureMoodboardCategories(ctx, userId);
      return existing._id;
    }

    const weddingId = await ctx.db.insert("wedding", {
      userId,
      partnerOneName: "Andra",
      partnerTwoName: "Rina",
      weddingDate: DEFAULT_WEDDING_DATE,
      fundTarget: 64_000_000,
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

    for (const item of DEFAULT_RUNDOWN) {
      await ctx.db.insert("rundownItem", {
        userId,
        startTime: item.startTime,
        title: item.title,
        createdAt: Date.now(),
      });
    }

    await ensureMoodboardCategories(ctx, userId);

    return weddingId;
  },
});

export const updateSettings = mutation({
  args: {
    partnerOneName: v.string(),
    partnerTwoName: v.string(),
    weddingDate: v.number(),
    fundTarget: v.number(),
    venueName: v.optional(v.string()),
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
      venueName: args.venueName?.trim() || undefined,
    });
  },
});
