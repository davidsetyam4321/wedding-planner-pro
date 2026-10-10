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
 * Resolve the shared workspace: a partner's coupleId points to its owner.
 * Anonymous users retain their own workspace until email sign-in migrates it.
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

/** Cryptographically random six-character invitation with unbiased sampling. */
export function generateInviteCode(): string {
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let code = "";
  while (code.length < 6) {
    const byte = new Uint8Array(1);
    crypto.getRandomValues(byte);
    if (byte[0] < limit) code += CODE_ALPHABET[byte[0] % CODE_ALPHABET.length];
  }
  return code;
}

const INVITE_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITE_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const INVITE_ATTEMPT_LIMIT = 5;
const INVITE_LOCKOUT_MS = 15 * 60 * 1000;

/** Create a new seven-day invite code when missing or expired. */
async function generateUniqueInviteCode(
  ctx: MutationCtx,
  currentWeddingId: Id<"wedding">,
): Promise<string> {
  for (;;) {
    const code = generateInviteCode();
    const existing = await ctx.db
      .query("wedding")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", code))
      .first();
    if (!existing || existing._id === currentWeddingId) return code;
  }
}

export async function ensureInviteCode(
  ctx: MutationCtx,
  wedding: Doc<"wedding">,
): Promise<string> {
  const now = Date.now();
  if (
    wedding.inviteCode &&
    wedding.inviteCodeExpiresAt !== undefined &&
    wedding.inviteCodeExpiresAt > now
  ) return wedding.inviteCode;
  const code = await generateUniqueInviteCode(ctx, wedding._id);
  await ctx.db.patch(wedding._id, {
    inviteCode: code,
    inviteCodeExpiresAt: now + INVITE_CODE_TTL_MS,
  });
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
    .withIndex("by_coupleId", (q) => q.eq("coupleId", userId))
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

    let connectedEmail: string | null = null;
    if (user.coupleId) {
      const owner = await ctx.db.get(user.coupleId);
      connectedEmail = owner?.email ?? null;
    } else {
      const partner = await ctx.db
        .query("users")
        .withIndex("by_coupleId", (q) => q.eq("coupleId", userId))
        .first();
      connectedEmail = partner?.email ?? null;
    }

    return {
      isOwner: user.coupleId === undefined,
      isAnonymous: user.isAnonymous ?? false,
      email: user.email ?? null,
      connectedEmail,
      inviteCode:
        wedding?.inviteCode &&
        wedding.inviteCodeExpiresAt !== undefined &&
        wedding.inviteCodeExpiresAt > Date.now()
          ? wedding.inviteCode
          : null,
    };
  },
});

/** Join the workspace behind an unexpired invite code. */
export const joinByInviteCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.isAnonymous) throw new Error("Masuk dengan email dulu sebelum bergabung.");
    if (user.coupleId) return { error: "Kamu sudah tergabung di sebuah workspace." };
    if (await isSharingWorkspace(ctx, userId)) {
      return { error: "Workspace kamu sudah punya pasangan." };
    }

    const now = Date.now();
    const attempt = await ctx.db
      .query("inviteAttempt")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (attempt?.blockedUntil && attempt.blockedUntil > now) {
      return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
    }
    const inWindow = Boolean(
      attempt && now - attempt.windowStartedAt < INVITE_ATTEMPT_WINDOW_MS,
    );
    const previousAttempts = inWindow && attempt ? attempt.attempts : 0;

    const recordFailure = async (message: string) => {
      const attempts = previousAttempts + 1;
      const blockedUntil = attempts >= INVITE_ATTEMPT_LIMIT
        ? now + INVITE_LOCKOUT_MS
        : undefined;
      if (attempt) {
        await ctx.db.patch(attempt._id, {
          windowStartedAt: inWindow ? attempt.windowStartedAt : now,
          attempts,
          blockedUntil,
        });
      } else {
        await ctx.db.insert("inviteAttempt", {
          userId,
          windowStartedAt: now,
          attempts,
          blockedUntil,
        });
      }
      return blockedUntil
        ? "Terlalu banyak percobaan. Coba lagi dalam 15 menit."
        : message;
    };

    const normalized = code.trim().toUpperCase();
    if (
      normalized.length !== 6 ||
      [...normalized].some((character) => !CODE_ALPHABET.includes(character))
    ) {
      return { error: await recordFailure("Format kode tidak valid.") };
    }
    const target = await ctx.db
      .query("wedding")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", normalized))
      .first();
    if (!target) return { error: await recordFailure("Kode tidak ditemukan.") };
    if (target.inviteCodeExpiresAt === undefined || target.inviteCodeExpiresAt <= now) {
      return { error: await recordFailure("Kode sudah kedaluwarsa. Minta kode baru.") };
    }
    if (target.userId === userId) {
      return { error: await recordFailure("Itu kode workspacemu sendiri.") };
    }
    const owner = await ctx.db.get(target.userId);
    if (!owner) return { error: await recordFailure("Workspace tidak ditemukan.") };
    if (owner.isAnonymous) {
      return {
        error: await recordFailure(
          "Pemilik workspace masih anonim. Minta dia masuk dengan email dulu.",
        ),
      };
    }
    const partner = await ctx.db
      .query("users")
      .withIndex("by_coupleId", (q) => q.eq("coupleId", target.userId))
      .first();
    if (partner) return { error: await recordFailure("Workspace itu sudah punya pasangan.") };

    await ctx.db.patch(userId, { coupleId: target.userId });
    if (attempt) await ctx.db.delete(attempt._id);
    return { error: null };
  },
});

/** Leave the shared workspace and return to your own empty workspace. */
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
    if (user.isAnonymous) throw new Error("Masuk dengan email dulu untuk membagikan kode.");
    if (user.coupleId) throw new Error("Hanya pemilik workspace yang bisa membagikan kode.");
    const wedding = await ctx.db
      .query("wedding")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!wedding) throw new Error("Workspace not found");

    if (regenerate) {
      await ctx.db.patch(wedding._id, {
        inviteCode: await generateUniqueInviteCode(ctx, wedding._id),
        inviteCodeExpiresAt: Date.now() + INVITE_CODE_TTL_MS,
      });
    } else {
      await ensureInviteCode(ctx, wedding);
    }
    const updated = await ctx.db.get(wedding._id);
    return updated?.inviteCode ?? null;
  },
});
