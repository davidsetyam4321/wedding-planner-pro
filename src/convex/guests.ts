import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { rsvpValidator } from "./schema";
import { workspaceUserId } from "./workspace";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return [];
    const userId = await workspaceUserId(ctx);
    const guests = await ctx.db
      .query("guest")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    guests.sort((a, b) => a.createdAt - b.createdAt);
    return guests;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    group: v.string(),
    pax: v.number(),
    phone: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { name, group, pax, phone, note }) => {
    const userId = await workspaceUserId(ctx);
    if (!name.trim()) throw new Error("Nama tamu wajib diisi");

    // ID-nya dikembalikan supaya alur "urungkan hapus" bisa memulihkan
    // status undangan/RSVP yang menyertainya.
    return await ctx.db.insert("guest", {
      userId,
      name: name.trim(),
      group: group.trim() || "Umum",
      pax: Math.max(1, Math.round(pax)),
      phone: phone?.trim() || undefined,
      note: note?.trim() || undefined,
      invited: false,
      rsvp: "pending",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    guestId: v.id("guest"),
    name: v.optional(v.string()),
    group: v.optional(v.string()),
    pax: v.optional(v.number()),
    phone: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await workspaceUserId(ctx);

    const guest = await ctx.db.get(args.guestId);
    if (!guest || guest.userId !== userId) throw new Error("Guest not found");

    const patch: {
      name?: string;
      group?: string;
      pax?: number;
      phone?: string;
      note?: string;
    } = {};

    if (args.name !== undefined) {
      const cleaned = args.name.trim();
      if (!cleaned) throw new Error("Nama tamu wajib diisi");
      patch.name = cleaned;
    }
    if (args.group !== undefined) patch.group = args.group.trim() || "Umum";
    if (args.pax !== undefined) patch.pax = Math.max(1, Math.round(args.pax));
    if (args.phone !== undefined) patch.phone = args.phone.trim() || undefined;
    if (args.note !== undefined) patch.note = args.note.trim() || undefined;

    await ctx.db.patch(args.guestId, patch);
  },
});

export const setInvited = mutation({
  args: { guestId: v.id("guest"), invited: v.boolean() },
  handler: async (ctx, { guestId, invited }) => {
    const userId = await workspaceUserId(ctx);
    const guest = await ctx.db.get(guestId);
    if (!guest || guest.userId !== userId) throw new Error("Guest not found");
    await ctx.db.patch(guestId, { invited });
  },
});

/**
 * Impor massal dari CSV — sekali panggil, satu transaksi.
 * Baris yang namanya kosong dilewati; sisa field diformat aman.
 */
export const createMany = mutation({
  args: {
    rows: v.array(
      v.object({
        name: v.string(),
        group: v.optional(v.string()),
        pax: v.optional(v.number()),
        phone: v.optional(v.string()),
        note: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { rows }) => {
    const userId = await workspaceUserId(ctx);
    const cleaned = rows.filter((row) => row.name.trim());
    if (cleaned.length === 0) return 0;

    const now = Date.now();
    for (const row of cleaned) {
      await ctx.db.insert("guest", {
        userId,
        name: row.name.trim().slice(0, 120),
        group: (row.group ?? "").trim() || "Umum",
        pax: Math.max(1, Math.min(50, Math.round(row.pax ?? 1))),
        phone: row.phone?.trim() || undefined,
        note: row.note?.trim().slice(0, 300) || undefined,
        invited: false,
        rsvp: "pending",
        createdAt: now,
      });
    }
    return cleaned.length;
  },
});

/** Marks every guest (optionally only one group) as invited in one go. */
export const inviteAll = mutation({
  args: { group: v.optional(v.string()) },
  handler: async (ctx, { group }) => {
    const userId = await workspaceUserId(ctx);

    const guests = await ctx.db
      .query("guest")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let updated = 0;
    for (const guest of guests) {
      if (group && guest.group !== group) continue;
      if (guest.invited) continue;
      await ctx.db.patch(guest._id, { invited: true });
      updated++;
    }
    return updated;
  },
});

export const setRsvp = mutation({
  args: { guestId: v.id("guest"), rsvp: rsvpValidator },
  handler: async (ctx, { guestId, rsvp }) => {
    const userId = await workspaceUserId(ctx);
    const guest = await ctx.db.get(guestId);
    if (!guest || guest.userId !== userId) throw new Error("Guest not found");
    await ctx.db.patch(guestId, { rsvp });
  },
});

export const remove = mutation({
  args: { guestId: v.id("guest") },
  handler: async (ctx, { guestId }) => {
    const userId = await workspaceUserId(ctx);
    const guest = await ctx.db.get(guestId);
    if (!guest || guest.userId !== userId) throw new Error("Guest not found");
    await ctx.db.delete(guestId);
  },
});
