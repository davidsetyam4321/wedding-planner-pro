import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const tabValidator = v.union(
  v.literal("dekorasi"),
  v.literal("baju"),
  v.literal("makeup"),
);

export const listBoxes = query({
  args: { tab: tabValidator },
  handler: async (ctx, { tab }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const boxes = await ctx.db
      .query("moodboardBox")
      .withIndex("by_user_tab", (q) => q.eq("userId", userId).eq("tab", tab))
      .collect();
    boxes.sort((a, b) => a.sortOrder - b.sortOrder);
    return boxes;
  },
});

export const listPhotos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const photos = await ctx.db
      .query("moodboardPhoto")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return await Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        url: (await ctx.storage.getUrl(photo.storageId)) ?? "",
      })),
    );
  },
});

export const createBox = mutation({
  args: { tab: tabValidator, title: v.string() },
  handler: async (ctx, { tab, title }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const existing = await ctx.db
      .query("moodboardBox")
      .withIndex("by_user_tab", (q) => q.eq("userId", userId).eq("tab", tab))
      .collect();

    await ctx.db.insert("moodboardBox", {
      userId,
      tab,
      title: title.trim() || "Kotak baru",
      sortOrder: existing.length,
    });
  },
});

export const renameBox = mutation({
  args: { boxId: v.id("moodboardBox"), title: v.string() },
  handler: async (ctx, { boxId, title }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const box = await ctx.db.get(boxId);
    if (!box || box.userId !== userId) throw new Error("Box not found");

    const cleaned = title.trim();
    if (!cleaned) throw new Error("Judul tidak boleh kosong");
    await ctx.db.patch(boxId, { title: cleaned });
  },
});

export const deleteBox = mutation({
  args: { boxId: v.id("moodboardBox") },
  handler: async (ctx, { boxId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const box = await ctx.db.get(boxId);
    if (!box || box.userId !== userId) throw new Error("Box not found");

    for (const photo of await ctx.db
      .query("moodboardPhoto")
      .withIndex("by_box", (q) => q.eq("boxId", boxId))
      .collect()) {
      await ctx.storage.delete(photo.storageId);
      await ctx.db.delete(photo._id);
    }
    await ctx.db.delete(boxId);
  },
});

/** Max 3 photos per box, like the reference UI. */
export const addPhoto = mutation({
  args: { boxId: v.id("moodboardBox"), storageId: v.id("_storage") },
  handler: async (ctx, { boxId, storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const box = await ctx.db.get(boxId);
    if (!box || box.userId !== userId) throw new Error("Box not found");

    const photos = await ctx.db
      .query("moodboardPhoto")
      .withIndex("by_box", (q) => q.eq("boxId", boxId))
      .collect();
    if (photos.length >= 3) {
      throw new Error("Maksimal 3 foto per kotak");
    }

    await ctx.db.insert("moodboardPhoto", {
      userId,
      boxId,
      storageId,
      sortOrder: photos.length,
    });
  },
});

export const removePhoto = mutation({
  args: { photoId: v.id("moodboardPhoto") },
  handler: async (ctx, { photoId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const photo = await ctx.db.get(photoId);
    if (!photo || photo.userId !== userId) throw new Error("Photo not found");

    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(photoId);
  },
});
