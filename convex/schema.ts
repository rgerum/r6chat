import { defineSchema, defineTable } from "convex/server";
import { StreamIdValidator } from "@convex-dev/persistent-text-streaming";
import { v } from "convex/values";

export default defineSchema({
  userMessages: defineTable({
    prompt: v.string(),
    responseStreamId: StreamIdValidator,
  }).index("by_stream", ["responseStreamId"]),

  chats: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    messages: v.array(v.string()),
    lastUpdate: v.optional(v.number()),
    pinned: v.optional(v.boolean()),
    access_public: v.optional(v.boolean()),
  })
    .index("by_user_creation_time", ["userId"])
    .index("by_user_lastUpdate", ["userId", "lastUpdate"]),

  userApiKeys: defineTable({
    userId: v.string(),
    modelProvider: v.string(),
    apiKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_provider", ["userId", "modelProvider"]),

  // In your message document
  messages: defineTable({
    chatId: v.id("chats"),
    role: v.string(),
    content: v.string(),
    // ... other fields
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          type: v.string(),
        }),
      ),
    ),
  }),
});
