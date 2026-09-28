import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Data ownership migration.
 *
 * Every visitor gets a silent anonymous account whose data lives under that
 * anonymous user id. When they sign in with an email on a NEW device, they
 * would otherwise start with an empty workspace — the workspace's ownership
 * is handed over to the (possibly fresh) email account, one time, so the
 * couple's data follows them across devices.
 *
 * The client remembers the anonymous user id (localStorage) before signing in
 * and passes it to `ensureSetup` right after the email session is established.
 */

/** Every data table that hangs off a `userId`. */
const WORKSPACE_TABLES = [
  "wedding",
  "budgetCategory",
  "budgetExpense",
  "savingDeposit",
  "checklistItem",
  "moodboardCategory",
  "moodboardBox",
  "moodboardPhoto",
  "guest",
  "vendor",
  "rundownItem",
] as const;

/**
 * Moves every workspace row from `from` to `to`. Runs inside the caller's
 * transaction so the handover is atomic (all rows or none).
 */
export async function moveWorkspaceData(
  ctx: MutationCtx,
  from: Id<"users">,
  to: Id<"users">,
): Promise<void> {
  for (const table of WORKSPACE_TABLES) {
    if (table === "savingDeposit") {
      const rows = await ctx.db
        .query("savingDeposit")
        .withIndex("by_user_savedAt", (q) => q.eq("userId", from))
        .collect();
      for (const row of rows) await ctx.db.patch(row._id, { userId: to });
    } else {
      const rows = await ctx.db
        .query(table)
        .withIndex("by_user", (q) => q.eq("userId", from))
        .collect();
      for (const row of rows) await ctx.db.patch(row._id, { userId: to });
    }
  }
}

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

    await moveWorkspaceData(ctx, anonymousUserId, emailUserId);

    await ctx.db.insert("migrationClaim", { anonymousUserId, emailUserId });
    return { migrated: true };
  },
});

export type ClaimResult = { migrated: boolean };
