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
  }).index("by_user", ["userId", "lastUpdate"]),
});
