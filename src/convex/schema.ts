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
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ── Planner Wedding ────────────────────────────────────────────────────
    // One workspace per signed-in user (the couple shares one account).

    wedding: defineTable({
      userId: v.id("users"),
      partnerOneName: v.string(),
      partnerTwoName: v.string(),
      weddingDate: v.number(), // epoch ms
      fundTarget: v.number(),
      fundClaimed: v.optional(v.boolean()),
      setupComplete: v.optional(v.boolean()),
    })
      .index("by_user", ["userId"])
      .index("by_user_claimed", ["userId", "fundClaimed"]),

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
    })
      .index("by_user", ["userId"])
      .index("by_category", ["categoryId"]),

    savingDeposit: defineTable({
      userId: v.id("users"),
      amount: v.number(),
      note: v.optional(v.string()),
      savedAt: v.number(),
    }).index("by_user_savedAt", ["userId", "savedAt"]),

    checklistItem: defineTable({
      userId: v.id("users"),
      label: v.string(),
      done: v.optional(v.boolean()),
      sortOrder: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_done", ["userId", "done"]),

    moodboardBox: defineTable({
      userId: v.id("users"),
      tab: v.union(
        v.literal("dekorasi"),
        v.literal("baju"),
        v.literal("makeup"),
      ),
      title: v.string(),
      sortOrder: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_tab", ["userId", "tab"]),

    moodboardPhoto: defineTable({
      userId: v.id("users"),
      boxId: v.id("moodboardBox"),
      storageId: v.id("_storage"),
      sortOrder: v.number(),
    })
      .index("by_box", ["boxId"])
      .index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
