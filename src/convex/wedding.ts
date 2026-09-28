import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { moveWorkspaceData } from "./migration";
import { workspaceUserId } from "./workspace";

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
    const authId = await getAuthUserId(ctx);
    if (authId === null) return null;
    const userId = await workspaceUserId(ctx);
    return await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Creates the workspace with friendly defaults on first visit. Idempotent.
 *
 * `anonymousUserId` (optional) is the id of the anonymous workspace this
 * device used before signing in with an email. When the fresh email account
 * has no workspace of its own, the anonymous one is adopted atomically inside
 * this transaction — so a reload after sign-in can never race ahead and seed
 * defaults that would block the migration.
 */
export const ensureSetup = mutation({
  args: { anonymousUserId: v.optional(v.id("users")) },
  handler: async (ctx, { anonymousUserId }) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) throw new Error("Not signed in");
    const userId = await workspaceUserId(ctx);

    const existing = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ensureMoodboardCategories(ctx, userId);
      return existing._id;
    }

    // Adopt this device's anonymous workspace (one-time, guarded) before
    // seeding defaults, so nothing is duplicated and no data is lost.
    if (anonymousUserId) {
      const emailUser = await ctx.db.get(authId);
      const anonUser = anonymousUserId === authId ? null : await ctx.db.get(anonymousUserId);
      if (
        emailUser &&
        !emailUser.isAnonymous &&
        anonUser &&
        anonUser.isAnonymous
      ) {
        const alreadyClaimed = await ctx.db
          .query("migrationClaim")
          .withIndex("by_anonymous", (q) => q.eq("anonymousUserId", anonymousUserId))
          .first();
        const anonWedding = await ctx.db
          .query("wedding")
          .withIndex("by_user", (q) => q.eq("userId", anonymousUserId))
          .first();
        if (!alreadyClaimed && anonWedding) {
          await moveWorkspaceData(ctx, anonymousUserId, userId);
          await ctx.db.insert("migrationClaim", {
            anonymousUserId,
            emailUserId: authId,
          });
          await ensureMoodboardCategories(ctx, userId);
          return anonWedding._id;
        }
      }
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

/** Public URL of the couple photo, or null when none has been uploaded. */
export const getCouplePhoto = query({
  args: {},
  handler: async (ctx): Promise<string | null> => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return null;
    const userId = await workspaceUserId(ctx);
    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding?.photoStorageId) return null;
    return (await ctx.storage.getUrl(wedding.photoStorageId)) ?? null;
  },
});

/** Stores a freshly uploaded photo, replacing (and deleting) the previous one. */
export const setCouplePhoto = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await workspaceUserId(ctx);

    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");

    const previous = wedding.photoStorageId;
    await ctx.db.patch(wedding._id, { photoStorageId: storageId });
    if (previous && previous !== storageId) {
      await ctx.storage.delete(previous);
    }
  },
});

export const removeCouplePhoto = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await workspaceUserId(ctx);

    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");

    const previous = wedding.photoStorageId;
    await ctx.db.patch(wedding._id, { photoStorageId: undefined });
    if (previous) {
      await ctx.storage.delete(previous);
    }
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
    const userId = await workspaceUserId(ctx);

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
