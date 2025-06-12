import { mutation, query } from "./_generated/server";
import { getUserId, getUserIdOrThrow } from "./user";
import { v } from "convex/values";

export const getChats = query({
  args: {},
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const addChat = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, { title }) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      throw new Error("Not logged in");
    }
    return await ctx.db.insert("chats", {
      userId,
      title,
      messages: [],
    });
  },
});
