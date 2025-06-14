"use client";
import ChatDashboard from "@/components/chat-dashboard";
import { useSelectedLayoutSegment } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";
import { Authenticated } from "convex/react";

export default function ChatLayout() {
  const chatId = useSelectedLayoutSegment() as Id<"chats"> | undefined;
  return (
    <Authenticated>
      <ChatDashboard chatId={chatId} />
    </Authenticated>
  );
}
