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
      .order("desc")
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
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      throw new Error("Not logged in");
    }
    // if the newest chat is still empty, use this as a new chat
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (chat && chat.messages.length == 0) {
      return chat._id;
    }
    return await ctx.db.insert("chats", {
      userId,
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
      throw new Error("Chat not found");
    }
    if (chat.userId !== userId) {
      throw new Error("Not your chat");
    }
    chat.messages = messages;
    chat.lastUpdate = Date.now();
    await ctx.db.patch(chatId, chat);
    return chat;
  },
});
