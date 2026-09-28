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
  },
  handler: async (ctx, { name, group, pax }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    if (!name.trim()) throw new Error("Nama tamu wajib diisi");

    await ctx.db.insert("guest", {
      userId,
      name: name.trim(),
      group: group.trim() || "Umum",
      pax: Math.max(1, Math.round(pax)),
      invited: false,
      rsvp: "pending",
      createdAt: Date.now(),
    });
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
