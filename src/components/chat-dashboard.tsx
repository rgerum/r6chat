"use client";
import React from "react";
import { Id } from "@convex/_generated/dataModel";
import { ChatHistoryWrapper } from "@/components/chat-history";
import { useSearchParams } from "next/navigation";

export default function ChatDashboard(props: { chatId?: string }) {
  const isNewChat = useSearchParams().get("new") !== null;

  const chatId = props.chatId ? (props.chatId as Id<"chats">) : undefined;
  return <ChatHistoryWrapper chatId={chatId} isNewChat={isNewChat} />;
}
