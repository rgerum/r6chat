import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId, getUserIdOrThrow } from "./user";

export const getUserApiKeys = query({
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getUserApiKeysMasked = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return [];
    }
    const keys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId))
      .collect();
    return keys.map((key) => ({
      ...key,
      apiKey: "********",
    }));
  },
});

export const getApiKey = query({
  args: {
    modelProvider: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    const entry = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", userId).eq("modelProvider", args.modelProvider),
      )
      .first();
    return entry?.apiKey;
  },
});

export const upsertApiKey = mutation({
  args: {
    modelProvider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("userApiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", userId).eq("modelProvider", args.modelProvider),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apiKey: args.apiKey,
        updatedAt: now,
      });
      return { _id: existing._id };
    } else {
      return await ctx.db.insert("userApiKeys", {
        userId,
        modelProvider: args.modelProvider,
        apiKey: args.apiKey,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const deleteApiKey = mutation({
  args: {
    id: v.id("userApiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const key = await ctx.db.get(args.id);
    if (!key || key.userId !== userId) {
      throw new Error("API key not found or access denied");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
