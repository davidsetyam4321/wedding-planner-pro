import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Sane ceiling that keeps a single reference box browsable. */
const MAX_PHOTOS_PER_BOX = 12;

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const categories = await ctx.db
      .query("moodboardCategory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    categories.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return categories;
  },
});

export const createCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const cleaned = name.trim();
    if (!cleaned) throw new Error("Nama kategori wajib diisi");

    const existing = await ctx.db
      .query("moodboardCategory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing.some((c) => c.name.toLowerCase() === cleaned.toLowerCase())) {
      throw new Error("Kategori sudah ada");
    }

    await ctx.db.insert("moodboardCategory", {
      userId,
      name: cleaned,
      sortOrder: existing.length,
    });
  },
});

export const renameCategory = mutation({
  args: { categoryId: v.id("moodboardCategory"), name: v.string() },
  handler: async (ctx, { categoryId, name }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const category = await ctx.db.get(categoryId);
    if (!category || category.userId !== userId) throw new Error("Category not found");

    const cleaned = name.trim();
    if (!cleaned) throw new Error("Nama kategori wajib diisi");

    const affected = await ctx.db
      .query("moodboardBox")
      .withIndex("by_user_tab", (q) => q.eq("userId", userId).eq("tab", category.name))
      .collect();
    for (const box of affected) {
      await ctx.db.patch(box._id, { tab: cleaned });
    }
    await ctx.db.patch(categoryId, { name: cleaned });
  },
});

export const deleteCategory = mutation({
  args: { categoryId: v.id("moodboardCategory") },
  handler: async (ctx, { categoryId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const category = await ctx.db.get(categoryId);
    if (!category || category.userId !== userId) throw new Error("Category not found");

    const boxes = await ctx.db
      .query("moodboardBox")
      .withIndex("by_user_tab", (q) => q.eq("userId", userId).eq("tab", category.name))
      .collect();
    for (const box of boxes) {
      for (const photo of await ctx.db
        .query("moodboardPhoto")
        .withIndex("by_box", (q) => q.eq("boxId", box._id))
        .collect()) {
        await ctx.storage.delete(photo.storageId);
        await ctx.db.delete(photo._id);
      }
      await ctx.db.delete(box._id);
    }
    await ctx.db.delete(categoryId);
  },
});

export const listBoxes = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const boxes = await ctx.db
      .query("moodboardBox")
      .withIndex("by_user_tab", (q) => q.eq("userId", userId).eq("tab", category))
      .collect();
    boxes.sort(
      (a, b) => a.sortOrder - b.sortOrder || (a.createdAt ?? 0) - (b.createdAt ?? 0),
    );

    return await Promise.all(
      boxes.map(async (box) => {
        const photos = await ctx.db
          .query("moodboardPhoto")
          .withIndex("by_box", (q) => q.eq("boxId", box._id))
          .collect();
        photos.sort((a, b) => a.sortOrder - b.sortOrder);
        return {
          ...box,
          photos: await Promise.all(
            photos.map(async (photo) => ({
              _id: photo._id,
              url: (await ctx.storage.getUrl(photo.storageId)) ?? "",
              caption: photo.caption,
            })),
          ),
        };
      }),
    );
  },
});

export const createBox = mutation({
  args: { category: v.string(), title: v.string() },
  handler: async (ctx, { category, title }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const existing = await ctx.db
      .query("moodboardBox")
      .withIndex("by_user_tab", (q) => q.eq("userId", userId).eq("tab", category))
      .collect();

    await ctx.db.insert("moodboardBox", {
      userId,
      tab: category,
      title: title.trim() || "Kotak baru",
      sortOrder: existing.length,
      createdAt: Date.now(),
    });
  },
});

export const updateBox = mutation({
  args: {
    boxId: v.id("moodboardBox"),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { boxId, title, category }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const box = await ctx.db.get(boxId);
    if (!box || box.userId !== userId) throw new Error("Box not found");

    const patch: { title?: string; tab?: string; createdAt?: number } = {};
    if (title !== undefined) {
      const cleaned = title.trim();
      if (!cleaned) throw new Error("Judul tidak boleh kosong");
      patch.title = cleaned;
    }
    if (category !== undefined && category !== box.tab) {
      const target = await ctx.db
        .query("moodboardBox")
        .withIndex("by_user_tab", (q) => q.eq("userId", userId).eq("tab", category))
        .collect();
      patch.tab = category;
      patch.createdAt = Date.now();
      patch.title = patch.title ?? box.title;
      await ctx.db.patch(boxId, { ...patch, sortOrder: target.length });
      return;
    }

    await ctx.db.patch(boxId, patch);
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

export const addPhoto = mutation({
  args: {
    boxId: v.id("moodboardBox"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, { boxId, storageId, caption }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const box = await ctx.db.get(boxId);
    if (!box || box.userId !== userId) throw new Error("Box not found");

    const photos = await ctx.db
      .query("moodboardPhoto")
      .withIndex("by_box", (q) => q.eq("boxId", boxId))
      .collect();
    if (photos.length >= MAX_PHOTOS_PER_BOX) {
      throw new Error(`Maksimal ${MAX_PHOTOS_PER_BOX} foto per kotak`);
    }

    await ctx.db.insert("moodboardPhoto", {
      userId,
      boxId,
      storageId,
      caption: caption?.trim() || undefined,
      sortOrder: photos.length,
    });
  },
});

export const updatePhotoCaption = mutation({
  args: { photoId: v.id("moodboardPhoto"), caption: v.string() },
  handler: async (ctx, { photoId, caption }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const photo = await ctx.db.get(photoId);
    if (!photo || photo.userId !== userId) throw new Error("Photo not found");
    await ctx.db.patch(photoId, { caption: caption.trim() || undefined });
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
