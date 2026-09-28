import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Data ownership migration.
 *
 * Every visitor gets a silent anonymous account whose data lives under that
 * anonymous user id. When they sign in with an email on a NEW device, they
 * would otherwise start with an empty workspace — this module hands the old
 * anonymous workspace over to the (possibly fresh) email account, one time,
 * so the couple's data follows them across devices.
 *
 * The client remembers the anonymous user id (localStorage) before signing in
 * and passes it here right after the email session is established.
 */
export const claim = mutation({
  args: { anonymousUserId: v.id("users") },
  handler: async (ctx, { anonymousUserId }) => {
    const emailUserId = await getAuthUserId(ctx);
    if (emailUserId === null) throw new Error("Not signed in");

    const emailUser = await ctx.db.get(emailUserId);
    if (!emailUser) throw new Error("User not found");
    if (emailUser.isAnonymous) return { migrated: false };

    // Never overwrite a workspace the email account already owns — this is
    // what protects the partner's data when signing in on a shared device.
    const existingWedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", emailUserId))
      .first();
    if (existingWedding) return { migrated: false };

    const anonUser = await ctx.db.get(anonymousUserId);
    if (!anonUser || !anonUser.isAnonymous) return { migrated: false };

    const alreadyClaimed = await ctx.db
      .query("migrationClaim")
      .withIndex("by_anonymous", (q) => q.eq("anonymousUserId", anonymousUserId))
      .first();
    if (alreadyClaimed) return { migrated: false };

    const anonWedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", anonymousUserId))
      .first();
    if (!anonWedding) return { migrated: false };

    const from = anonymousUserId;
    const to = emailUserId;

    const weddings = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of weddings) await ctx.db.patch(row._id, { userId: to });

    const budgetCategories = await ctx.db
      .query("budgetCategory")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of budgetCategories)
      await ctx.db.patch(row._id, { userId: to });

    const budgetExpenses = await ctx.db
      .query("budgetExpense")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of budgetExpenses)
      await ctx.db.patch(row._id, { userId: to });

    const deposits = await ctx.db
      .query("savingDeposit")
      .withIndex("by_user_savedAt", (q) => q.eq("userId", from))
      .collect();
    for (const row of deposits) await ctx.db.patch(row._id, { userId: to });

    const checklistItems = await ctx.db
      .query("checklistItem")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of checklistItems)
      await ctx.db.patch(row._id, { userId: to });

    const moodboardCategories = await ctx.db
      .query("moodboardCategory")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of moodboardCategories)
      await ctx.db.patch(row._id, { userId: to });

    const moodboardBoxes = await ctx.db
      .query("moodboardBox")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of moodboardBoxes)
      await ctx.db.patch(row._id, { userId: to });

    const moodboardPhotos = await ctx.db
      .query("moodboardPhoto")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of moodboardPhotos)
      await ctx.db.patch(row._id, { userId: to });

    const guests = await ctx.db
      .query("guest")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of guests) await ctx.db.patch(row._id, { userId: to });

    const vendors = await ctx.db
      .query("vendor")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of vendors) await ctx.db.patch(row._id, { userId: to });

    const rundownItems = await ctx.db
      .query("rundownItem")
      .withIndex("by_user", (q) => q.eq("userId", from))
      .collect();
    for (const row of rundownItems)
      await ctx.db.patch(row._id, { userId: to });

    await ctx.db.insert("migrationClaim", { anonymousUserId, emailUserId });
    return { migrated: true };
  },
});

export type ClaimResult = { migrated: boolean };

/** Exported for typing on the client (unused on the server). */
export type AnonymousClaimId = Id<"users">;
