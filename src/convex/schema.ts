import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const rsvpValidator = v.union(
  v.literal("pending"),
  v.literal("hadir"),
  v.literal("tidak"),
);

export const vendorStatusValidator = v.union(
  v.literal("belum"),
  v.literal("dp"),
  v.literal("lunas"),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // ── Planner Wedding ────────────────────────────────────────────────
      /** Workspace pemilik data utama. Null = akun ini adalah pemilik workspace sendiri. */
      coupleId: v.optional(v.id("users")),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ── Planner Wedding ────────────────────────────────────────────────────

    /** Couple profile: names, date, funding target. */
    wedding: defineTable({
      userId: v.id("users"),
      partnerOneName: v.string(),
      partnerTwoName: v.string(),
      weddingDate: v.number(), // epoch ms
      fundTarget: v.number(),
      venueName: v.optional(v.string()),
      guestEstimate: v.optional(v.number()),
      /** Foto pasangan yang tampil di dashboard. */
      photoStorageId: v.optional(v.id("_storage")),
      /** Kode 6 karakter untuk mengundang pasangan ke workspace ini. */
      inviteCode: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_inviteCode", ["inviteCode"]),

    /** Budget per category + its expenses. */
    budgetCategory: defineTable({
      userId: v.id("users"),
      name: v.string(),
      allocated: v.number(),
      sortOrder: v.number(),
    }).index("by_user", ["userId"]),

    budgetExpense: defineTable({
      userId: v.id("users"),
      categoryId: v.id("budgetCategory"),
      label: v.string(),
      amount: v.number(),
      paidAt: v.optional(v.number()),
      createdAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_category", ["categoryId"]),

    /** Savings deposits toward the fund target. */
    savingDeposit: defineTable({
      userId: v.id("users"),
      amount: v.number(),
      note: v.optional(v.string()),
      savedAt: v.number(),
    }).index("by_user_savedAt", ["userId", "savedAt"]),

    /** Preparation tasks. */
    checklistItem: defineTable({
      userId: v.id("users"),
      label: v.string(),
      done: v.optional(v.boolean()),
      /** Waktu tugas ditandai selesai (untuk burndown progres). */
      doneAt: v.optional(v.number()),
      sortOrder: v.number(),
      createdAt: v.optional(v.number()),
      /** Urgency shown on the dashboard agenda; lama = tidak ada (dianggap "sedang"). */
      priority: v.optional(
        v.union(v.literal("tinggi"), v.literal("sedang"), v.literal("rendah")),
      ),
    })
      .index("by_user", ["userId"])
      .index("by_user_done", ["userId", "done"]),

    /** Mood board categories — free text so the couple can add their own. */
    moodboardCategory: defineTable({
      userId: v.id("users"),
      name: v.string(),
      sortOrder: v.number(),
    }).index("by_user", ["userId"]),

    /** One box per reference idea; holds a gallery of photos. */
    moodboardBox: defineTable({
      userId: v.id("users"),
      /** category name (kept as `tab` for backwards compatibility) */
      tab: v.string(),
      title: v.string(),
      sortOrder: v.number(),
      createdAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_user_tab", ["userId", "tab"]),

    moodboardPhoto: defineTable({
      userId: v.id("users"),
      boxId: v.id("moodboardBox"),
      storageId: v.id("_storage"),
      caption: v.optional(v.string()),
      sortOrder: v.number(),
    })
      .index("by_box", ["boxId"])
      .index("by_user", ["userId"]),

    /** Guest list with invitation + RSVP status. */
    guest: defineTable({
      userId: v.id("users"),
      name: v.string(),
      group: v.string(),
      pax: v.number(),
      phone: v.optional(v.string()),
      note: v.optional(v.string()),
      invited: v.optional(v.boolean()),
      rsvp: rsvpValidator,
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    /** Vendors with contact, cost and payment status. */
    vendor: defineTable({
      userId: v.id("users"),
      name: v.string(),
      category: v.string(),
      contact: v.optional(v.string()),
      cost: v.number(),
      dpAmount: v.optional(v.number()),
      note: v.optional(v.string()),
      status: vendorStatusValidator,
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    /** Wedding day rundown, ordered by clock time. */
    rundownItem: defineTable({
      userId: v.id("users"),
      startTime: v.string(), // "08:00"
      title: v.string(),
      note: v.optional(v.string()),
      durationMinutes: v.optional(v.number()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    /**
     * One-way handshake when an anonymous workspace is migrated to a fresh
     * email account: the anonymous user's id is claimed by the email user.
     */
    migrationClaim: defineTable({
      anonymousUserId: v.id("users"),
      emailUserId: v.id("users"),
    }).index("by_anonymous", ["anonymousUserId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
