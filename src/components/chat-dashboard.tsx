"use client";
import React from "react";
import { Id } from "@convex/_generated/dataModel";
import { ChatHistoryWrapper } from "@/components/chat-history";

export default function ChatDashboard(props: {
  chatId?: string;
  isNewChat: boolean;
}) {
  const chatId = props.chatId ? (props.chatId as Id<"chats">) : undefined;
  return <ChatHistoryWrapper chatId={chatId} isNewChat={props.isNewChat} />;
}
