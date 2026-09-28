import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { rsvpValidator } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
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
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    if (!name.trim()) throw new Error("Nama tamu wajib diisi");

    await ctx.db.insert("guest", {
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
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

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
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const guest = await ctx.db.get(guestId);
    if (!guest || guest.userId !== userId) throw new Error("Guest not found");
    await ctx.db.patch(guestId, { invited });
  },
});

/** Marks every guest (optionally only one group) as invited in one go. */
export const inviteAll = mutation({
  args: { group: v.optional(v.string()) },
  handler: async (ctx, { group }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

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
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const guest = await ctx.db.get(guestId);
    if (!guest || guest.userId !== userId) throw new Error("Guest not found");
    await ctx.db.patch(guestId, { rsvp });
  },
});

export const remove = mutation({
  args: { guestId: v.id("guest") },
  handler: async (ctx, { guestId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const guest = await ctx.db.get(guestId);
    if (!guest || guest.userId !== userId) throw new Error("Guest not found");
    await ctx.db.delete(guestId);
  },
});
