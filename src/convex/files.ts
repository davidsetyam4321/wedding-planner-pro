import { action } from "./_generated/server";

/** Generates a short-lived upload URL for moodboard photos. */
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

