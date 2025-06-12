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

export const getChat = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
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

export const addMessageToChat = mutation({
  args: {
    chatId: v.id("chats"),
    messages: v.array(v.string()),
  },
  handler: async (ctx, { chatId, messages }) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      throw new Error("Not logged in");
    }
    let chat = await ctx.db.get(chatId);
    if (!chat) {
      const chatId = await ctx.db.insert("chats", {
        userId,
        title: "New Chat",
        messages: [],
      });
      chat = await ctx.db.get(chatId);
    }
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (chat.userId !== userId) {
      throw new Error("Not your chat");
    }
    chat.messages = messages;
    await ctx.db.patch(chatId, chat);
    return chat;
  },
});
