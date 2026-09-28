import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Workspace resolution: the couple shares ONE wedding workspace.
 *
 * - The workspace owner is the user whose id is on the wedding document.
 * - A partner account carries `coupleId` pointing at the owner; all their
 *   data queries/mutations are re-routed to the owner's id so both see and
 *   edit the same rows in real time.
 * - Anonymous users (silent sign-in) own their own workspace until they sign
 *   in with an email; ownership transfers via `migration.ts` so nothing is
 *   lost when moving between devices.
 */
export async function workspaceUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in");

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");

  if (user.coupleId) {
    const owner = await ctx.db.get(user.coupleId);
    if (owner) return owner._id;
  }

  return userId;
}

export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Regenerates the partner invite code (idempotent per owner). */
export async function ensureInviteCode(
  ctx: MutationCtx,
  wedding: Doc<"wedding">,
): Promise<string> {
  if (wedding.inviteCode) return wedding.inviteCode;
  const code = generateInviteCode();
  await ctx.db.patch(wedding._id, { inviteCode: code });
  return code;
}

/** True when this account already shares a workspace with someone. */
export async function isSharingWorkspace(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (user?.coupleId) return true;

  const partner = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("coupleId"), userId))
    .first();
  return partner !== null;
}

export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const effectiveId = user.coupleId ?? userId;
    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", effectiveId))
      .first();

    // The "other side" of the connection: for a partner it is the workspace
    // owner, for an owner it is whoever joined via the invite code.
    let connectedEmail: string | null = null;
    if (user.coupleId) {
      const owner = await ctx.db.get(user.coupleId);
      connectedEmail = owner?.email ?? null;
    } else {
      const partner = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("coupleId"), userId))
        .first();
      connectedEmail = partner?.email ?? null;
    }

    return {
      isOwner: user.coupleId === undefined,
      isAnonymous: user.isAnonymous ?? false,
      email: user.email ?? null,
      connectedEmail,
      inviteCode: wedding?.inviteCode ?? null,
    };
  },
});

/** Join the couple workspace behind an invite code. */
export const joinByInviteCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.isAnonymous) {
      throw new Error("Masuk dengan email dulu sebelum bergabung.");
    }
    if (user.coupleId) throw new Error("Kamu sudah tergabung di sebuah workspace.");

    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalized)) {
      throw new Error("Format kode tidak valid.");
    }

    const target = await ctx.db
      .query("wedding")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", normalized))
      .first();
    if (!target) throw new Error("Kode tidak ditemukan.");
    if (target.userId === userId) {
      throw new Error("Itu kode workspacemu sendiri.");
    }

    const owner = await ctx.db.get(target.userId);
    if (!owner) throw new Error("Workspace tidak ditemukan.");
    if (owner.isAnonymous) {
      throw new Error(
        "Pemilik workspace masih anonim. Minta dia masuk dengan email dulu.",
      );
    }

    const partner = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("coupleId"), target.userId))
      .first();
    if (partner) throw new Error("Workspace itu sudah punya pasangan.");

    await ctx.db.patch(userId, { coupleId: target.userId });
  },
});

/** Leave the shared workspace and get your own back. */
export const leaveWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (!user.coupleId) throw new Error("Kamu tidak sedang bergabung.");

    await ctx.db.patch(userId, { coupleId: undefined });
  },
});

/** Show or regenerate the invite code. */
export const revealInviteCode = mutation({
  args: { regenerate: v.optional(v.boolean()) },
  handler: async (ctx, { regenerate }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.isAnonymous) {
      throw new Error("Masuk dengan email dulu untuk membagikan kode.");
    }
    if (user.coupleId) {
      throw new Error("Hanya pemilik workspace yang bisa membagikan kode.");
    }

    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");

    if (regenerate) {
      await ctx.db.patch(wedding._id, { inviteCode: generateInviteCode() });
    } else {
      await ensureInviteCode(ctx, wedding);
    }

    const updated = await ctx.db.get(wedding._id);
    return updated?.inviteCode ?? null;
  },
});
