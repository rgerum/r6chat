// convex/files.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getUserIdOrThrow } from "./user";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const sendImage = mutation({
  args: {
    chatId: v.id("chats"),
    storageId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Add the message to the chat
    await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: "",
      role: "user",
      attachments: [
        {
          storageId: args.storageId as Id<"_storage">,
          type: args.type,
        },
      ],
    });

    // Update the chat's lastUpdate timestamp
    await ctx.db.patch(args.chatId, {
      lastUpdate: Date.now(),
    });
  },
});

export const createAttachment = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    chatId: v.id("chats"),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrThrow(ctx);
    await ctx.db.insert("attachments", {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      chatId: args.chatId,
      messageId: args.messageId,
    });
    return ctx.storage.getUrl(args.storageId);
  },
});
