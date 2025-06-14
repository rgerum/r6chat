"use client";
import React from "react";
import { Id } from "@/../convex/_generated/dataModel";
import { Sidebar } from "./sidebar";
import { ChatHistoryWrapper } from "@/components/chat-history";

export default function ChatDashboard(props: { chatId?: string }) {
  const chatId = props.chatId ? (props.chatId as Id<"chats">) : undefined;
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col max-w-[256px] px-3 py-4 bg-pink-100 fixed h-screen">
        <Sidebar chatId={props.chatId} />
      </div>
      <div className={" ml-[256px] w-full"}>
        <ChatHistoryWrapper chatId={chatId} />
      </div>
    </div>
  );
}
