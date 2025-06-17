import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteAllUserData = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete all API keys for the user
    const userKeys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(userKeys.map((key) => ctx.db.delete(key._id)));

    // Delete all chats for the user
    const userChats = await ctx.db
      .query("chats")
      .withIndex("by_user_lastUpdate", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(userChats.map((chat) => ctx.db.delete(chat._id)));

    return { success: true };
  },
});
