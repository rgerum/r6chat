"use client";
import ChatDashboard from "@/components/chat-dashboard";
import { useSelectedLayoutSegment } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";
import { Authenticated, Unauthenticated } from "convex/react";
import { ChatHistoryWrapper } from "@/components/chat-history";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/appSidebar";

export default function ChatLayout() {
  const chatId = useSelectedLayoutSegment() as Id<"chats"> | undefined;
  return (
    <>
      <Authenticated>
        <SidebarProvider>
          <AppSidebar chatId={chatId} />
          <SidebarTrigger className="fixed left-3 top-4.5 z-50" />
          <main className="w-full">
            <ChatDashboard chatId={chatId} />
          </main>
        </SidebarProvider>
      </Authenticated>
      <Unauthenticated>
        <ChatHistoryWrapper chatId={chatId} />
      </Unauthenticated>
    </>
  );
}
