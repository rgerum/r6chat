"use client";
import ChatDashboard from "@/components/chat-dashboard";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { Id } from "@convex/_generated/dataModel";
import { Authenticated, Unauthenticated } from "convex/react";
import { ChatHistoryWrapper } from "@/components/chat-history";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/appSidebar";
import React from "react";

function useKeyboardShortcuts() {
  const router = useRouter();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Shift+O (Mac) or Ctrl+Shift+O (Windows/Linux)
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "o"
      ) {
        e.preventDefault();
        router.push("/chat");
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);
}

export default function ChatLayout() {
  const chatId = useSelectedLayoutSegment() as Id<"chats"> | undefined;
  useKeyboardShortcuts();
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
