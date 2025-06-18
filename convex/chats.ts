import { mutation, query } from "./_generated/server";
import { getUserId, getUserIdOrThrow } from "./user";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getChatsPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Not logged in");
    }
    const results = await ctx.db
      .query("chats")
      .withIndex("by_user_lastUpdate", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...results,
      page: results.page.map((chat) => ({
        _id: chat._id,
        title: chat.title,
        lastUpdate: chat.lastUpdate,
        pinned: chat.pinned,
        branched: chat.branched,
        message_count: chat.messages.length,
      })),
    };
  },
});

export const getChats = query({
  args: {},
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("chats")
      .withIndex("by_user_lastUpdate", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getChat = query({
  args: {
    chatId: v.optional(v.id("chats")),
  },
  handler: async (ctx, args) => {
    if (!args.chatId) {
      return null;
    }
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return null;
    }
    const userId = await getUserId(ctx);
    const writeable = chat.userId === userId;
    if (!writeable && !chat.access_public) {
      return null;
    }
    return { ...chat, writeable: chat.userId === userId };
  },
});

export const getChatTitle = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    return chat?.title;
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
      .withIndex("by_user_creation_time", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (chat && chat.messages.length == 0) {
      return chat._id;
    }
    return await ctx.db.insert("chats", {
      userId,
      messages: [],
      pinned: false,
      lastUpdate: Date.now(),
      access_public: false,
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

export const addTitleToChat = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, { chatId, title }) => {
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
    chat.title = title;
    chat.lastUpdate = Date.now();
    await ctx.db.patch(chatId, chat);
    return chat;
  },
});

export const deleteChat = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, { chatId }) => {
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
    await ctx.db.delete(chatId);
  },
});

export const pinChat = mutation({
  args: {
    chatId: v.id("chats"),
    pinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      throw new Error("Not logged in");
    }
    let chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (chat.userId !== userId) {
      throw new Error("Not your chat");
    }
    chat.pinned = args.pinned;
    await ctx.db.patch(args.chatId, chat);
  },
});

export const updateChatReadable = mutation({
  args: {
    chatId: v.id("chats"),
    access_public: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      throw new Error("Not logged in");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== userId) {
      throw new Error("Not your chat");
    }

    await ctx.db.patch(args.chatId, {
      access_public: args.access_public,
    });

    return { success: true };
  },
});

export const branchChat = mutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    if (!userId) {
      throw new Error("Not logged in");
    }
    let chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (chat.userId !== userId) {
      throw new Error("Not your chat");
    }
    const newMessages = [];
    for (let i = 0; i < chat.messages.length; i++) {
      const message = chat.messages[i];
      newMessages.push(message);
      if (JSON.parse(message).id === args.messageId) {
        break;
      }
    }
    chat.messages = newMessages;
    chat.lastUpdate = Date.now();
    chat.branched = chat._id;
    const { _id, _creationTime, ...rest } = chat;
    return await ctx.db.insert("chats", rest);
  },
});
