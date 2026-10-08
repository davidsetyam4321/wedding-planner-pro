import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { workspaceUserId } from "./workspace";

/**
 * Daftar seserahan milik workspace berjalan, urut pemasukan (sortOrder).
 * Baris baru selalu mulai dari status "link" — pengguna memindahkannya ke
 * "keranjang"/"dibeli" lewat switch sekali ketuk di daftar.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return [];
    const userId = await workspaceUserId(ctx);
    const items = await ctx.db
      .query("seserahanItem")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return items;
  },
});

async function nextSortOrder(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<number> {
  const existing = await ctx.db
    .query("seserahanItem")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return existing.length;
}

export const create = mutation({
  args: {
    title: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, { title, link }) => {
    const userId = await workspaceUserId(ctx);

    const cleaned = title.trim();
    if (!cleaned) throw new Error("Nama barang tidak boleh kosong");

    return await ctx.db.insert("seserahanItem", {
      userId,
      title: cleaned,
      link: link?.trim() || undefined,
      // Status awal = baru input link; di-switch dari daftar.
      status: "link",
      sortOrder: await nextSortOrder(ctx, userId),
      createdAt: Date.now(),
    });
  },
});

/** Ganti status belanja — satu ketuk dari baris daftar (link → cart → bought). */
export const setStatus = mutation({
  args: {
    itemId: v.id("seserahanItem"),
    status: v.union(v.literal("link"), v.literal("cart"), v.literal("bought")),
  },
  handler: async (ctx, { itemId, status }) => {
    const userId = await workspaceUserId(ctx);

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.patch(itemId, { status, updatedAt: Date.now() });
  },
});

/**
 * Ubah nama dan/atau link tanpa menyentuh status.
 * `link: null` (atau string kosong) menghapus link — dipakai form edit.
 */
export const update = mutation({
  args: {
    itemId: v.id("seserahanItem"),
    title: v.optional(v.string()),
    link: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { itemId, title, link }) => {
    const userId = await workspaceUserId(ctx);

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    const patch: {
      title?: string;
      link?: string | undefined;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (title !== undefined) {
      const cleaned = title.trim();
      if (!cleaned) throw new Error("Nama barang tidak boleh kosong");
      patch.title = cleaned;
    }
    if (link !== undefined) patch.link = link ? link.trim() || undefined : undefined;

    await ctx.db.patch(itemId, patch);
  },
});

export const remove = mutation({
  args: { itemId: v.id("seserahanItem") },
  handler: async (ctx, { itemId }) => {
    const userId = await workspaceUserId(ctx);

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.delete(itemId);
  },
});
