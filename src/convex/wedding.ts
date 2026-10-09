import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { moveWorkspaceData } from "./migration";
import { workspaceUserId } from "./workspace";
import { assertValidImageUpload } from "./files";

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

/** Jenis (kategori) vendor bawaan — dikelola pengguna dari halaman Pengaturan. */
export const DEFAULT_VENDOR_CATEGORIES = [
  "Katering",
  "Venue",
  "Dekorasi & Florist",
  "Dokumentasi",
  "MUA & Rias",
  "Gown & Busana",
  "Undangan & Cetak",
  "Souvenir & Hampers",
  "MC & Hiburan",
  "Transportasi",
  "Lainnya",
];

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
    await assertValidImageUpload(ctx, storageId);

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
      // Form pertama kali diisi = onboarding selesai.
      onboarded: true,
    });
  },
});

/**
 * Simpan palet warna ruang kerja — preset (id saja) atau kustom
 * (id "custom" + lima slot warna). Tidak ada input hex dari pengguna;
 * slot kustom selalu berisi nilai dari library swatch `@/lib/palettes`.
 */
export const updatePalette = mutation({
  args: {
    paletteId: v.string(),
    paletteCustom: v.optional(
      v.object({
        primary: v.string(),
        secondary: v.string(),
        soft: v.string(),
        nature: v.string(),
        background: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await workspaceUserId(ctx);

    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");

    await ctx.db.patch(wedding._id, {
      paletteId: args.paletteId,
      paletteCustom: args.paletteCustom,
    });
  },
});

/**
 * Daftar jenis vendor efektif untuk dropdown (halaman Vendor) dan pengelolaan
 * di Pengaturan: daftar pengaturan (atau bawaan) plus jenis yang masih dipakai
 * vendor lama — supaya data free-text sebelumnya tetap tampil & bisa dikelola.
 */
export const getVendorCategories = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return [];
    const userId = await workspaceUserId(ctx);

    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const base = wedding?.vendorCategories ?? DEFAULT_VENDOR_CATEGORIES;
    const merged = [...base];
    const seen = new Set(base.map((name) => name.toLowerCase()));

    const vendors = await ctx.db
      .query("vendor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const vendor of vendors) {
      const name = vendor.category.trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      merged.push(name);
    }
    return merged;
  },
});

/** Menambah jenis vendor baru (dari halaman Pengaturan). */
export const addVendorCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await workspaceUserId(ctx);
    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");

    const cleaned = name.trim();
    if (!cleaned) throw new Error("Nama jenis vendor tidak boleh kosong");
    if (cleaned.length > 40) {
      throw new Error("Nama jenis vendor terlalu panjang (maks. 40 karakter)");
    }

    const current = wedding.vendorCategories ?? DEFAULT_VENDOR_CATEGORIES;
    if (current.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      throw new Error("Jenis vendor sudah ada di daftar");
    }
    await ctx.db.patch(wedding._id, { vendorCategories: [...current, cleaned] });
  },
});

/**
 * Menghapus jenis vendor dari daftar. Ditolak bila masih dipakai vendor
 * (ubah jenis vendor itu dulu) atau bila daftar akan jadi kosong.
 */
export const removeVendorCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await workspaceUserId(ctx);
    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");

    const target = name.trim().toLowerCase();
    if (!target) throw new Error("Jenis vendor tidak ditemukan");

    // Cek pemakaian dulu supaya jenis yang hanya muncul dari data lama
    // (bukan dari daftar pengaturan) tetap memberi pesan yang tepat.
    const vendors = await ctx.db
      .query("vendor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const inUse = vendors.filter(
      (vendor) => vendor.category.trim().toLowerCase() === target,
    ).length;
    if (inUse > 0) {
      throw new Error(
        `Masih dipakai ${inUse} vendor — ubah jenis vendor mereka dulu.`,
      );
    }

    const current = wedding.vendorCategories ?? DEFAULT_VENDOR_CATEGORIES;
    const next = current.filter((item) => item.toLowerCase() !== target);
    if (next.length === current.length) {
      throw new Error("Jenis vendor tidak ditemukan");
    }
    if (next.length === 0) {
      throw new Error("Minimal satu jenis vendor harus tersisa");
    }
    await ctx.db.patch(wedding._id, { vendorCategories: next });
  },
});

/** Menandai onboarding selesai tanpa mengubah data (tombol “Lewati”). */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await workspaceUserId(ctx);
    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");
    await ctx.db.patch(wedding._id, { onboarded: true });
  },
});
